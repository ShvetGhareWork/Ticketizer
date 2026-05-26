package com.example.Ticketizer.domain.service;

import com.example.Ticketizer.domain.dto.PaymentCallbackRequest;
import com.example.Ticketizer.domain.entity.Booking;
import com.example.Ticketizer.domain.entity.BookingStatus;
import com.example.Ticketizer.domain.entity.SeatStatus;
import com.example.Ticketizer.domain.repository.BookingRepository;
import com.example.Ticketizer.domain.repository.SeatRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentSettlementService {

    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final StringRedisTemplate redisTemplate;
    private final QrCodeGeneratorService qrCodeGeneratorService;

    @Transactional
    public void fulfillOrder(PaymentCallbackRequest request) {
        log.info("Processing settlement for booking ref: {}. Status: {}", 
                request.bookingReference(), request.paymentStatus());

        // 1. Locate the target pending asset ledger record with a retry loop to handle eventual consistency (Kafka consumer lag)
        Booking booking = null;
        for (int i = 0; i < 6; i++) {
            var optionalBooking = bookingRepository.findByBookingReference(request.bookingReference());
            if (optionalBooking.isPresent()) {
                booking = optionalBooking.get();
                break;
            }
            try {
                log.info("Kafka consumer latency detected for reference {}. Retrying in 250ms (attempt {}/6)...", request.bookingReference(), i + 1);
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        if (booking == null) {
            throw new IllegalArgumentException("Booking reference not found after retries: " + request.bookingReference());
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            log.warn("Booking ref: {} is already processed ({}). Aborting duplicate settlement step.", 
                    request.bookingReference(), booking.getStatus());
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(request.paymentStatus())) {
            // Happy Path: Finalize state vectors across DB
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.getSeat().setStatus(SeatStatus.BOOKED);
            
            // Compile ticket structural parameters into a lightweight verification manifest string
            String ticketManifest = String.format(
                    "{\"ref\":\"%s\",\"showId\":%d,\"seat\":\"%s\",\"userId\":%d,\"timestamp\":\"%s\"}",
                    booking.getBookingReference(),
                    booking.getShow().getId(),
                    booking.getSeat().getSeatNumber(),
                    booking.getUserId(),
                    java.time.Instant.now().toString()
            );

            // Generate secure Base64 image layout data mapping
            String base64QrImage = qrCodeGeneratorService.generateQrCodeBase64(ticketManifest);
            booking.setQrCodePayload(base64QrImage); // Persist directly into the table context
            
            bookingRepository.save(booking);
            seatRepository.save(booking.getSeat());

            // Evict lock registration metadata block cleanly out of Redis memory mapping space
            String lockedHashKey = "show:" + booking.getShow().getId() + ":locked_seats";
            redisTemplate.opsForHash().delete(lockedHashKey, String.valueOf(booking.getSeat().getId()));
            
            log.info("State convergence complete. Secure entry QR token appended to booking reference {}.", booking.getBookingReference());
        } else {
            // Sad Path: Gateway reports payment failure. Delegate to clear up operations
            log.warn("Payment failed for reference {}. Releasing locked slots back to game loops.", request.bookingReference());
            booking.setStatus(BookingStatus.CANCELLED);
            booking.getSeat().setStatus(SeatStatus.AVAILABLE);
            
            bookingRepository.save(booking);
            seatRepository.save(booking.getSeat());

            // Put capacity back into Redis Sets using our structural components
            String availableSetKey = "show:" + booking.getShow().getId() + ":available_seats";
            String lockedHashKey = "show:" + booking.getShow().getId() + ":locked_seats";
            
            redisTemplate.opsForHash().delete(lockedHashKey, String.valueOf(booking.getSeat().getId()));
            redisTemplate.opsForSet().add(availableSetKey, String.valueOf(booking.getSeat().getId()));
        }
    }
}