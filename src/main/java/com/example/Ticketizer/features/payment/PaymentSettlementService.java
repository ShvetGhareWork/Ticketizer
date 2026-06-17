package com.example.Ticketizer.features.payment;

import com.example.Ticketizer.features.payment.PaymentCallbackRequest;
import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.booking.BookingStatus;
import com.example.Ticketizer.features.inventory.SeatStatus;
import com.example.Ticketizer.features.booking.BookingRepository;
import com.example.Ticketizer.features.inventory.SeatRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.Ticketizer.shared.utils.QrCodeGeneratorService;
import com.example.Ticketizer.features.auth.User;
import com.example.Ticketizer.features.auth.UserRepository;
import com.example.Ticketizer.config.NoftificationPublisherProducer;
import com.example.Ticketizer.features.booking.TicketNotificationEvent;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentSettlementService {

    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final StringRedisTemplate redisTemplate;
    private final QrCodeGeneratorService qrCodeGeneratorService;
    private final UserRepository userRepository;
    private final NoftificationPublisherProducer notificationPublisherProducer;
    private final com.example.Ticketizer.features.notification.NotificationRepository notificationRepository;

    @Transactional
    public void fulfillOrder(PaymentCallbackRequest request) {
        fulfillOrder(request, true);
    }

    @Transactional
    public void fulfillOrder(PaymentCallbackRequest request, boolean publishEmail) {
        log.info("Processing settlement for booking ref: {}. Status: {}, PublishEmail: {}", 
                request.bookingReference(), request.paymentStatus(), publishEmail);

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

        final Booking finalBooking = booking;

        if (finalBooking.getStatus() != BookingStatus.PENDING) {
            log.warn("Booking ref: {} is already processed ({}). Aborting duplicate settlement step.", 
                    request.bookingReference(), finalBooking.getStatus());
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(request.paymentStatus())) {
            // Happy Path: Finalize state vectors across DB
            finalBooking.setStatus(BookingStatus.CONFIRMED);
            finalBooking.getSeat().setStatus(SeatStatus.BOOKED);
            
            // Compile ticket structural parameters into a lightweight verification manifest string
            String ticketManifest = String.format(
                    "{\"ref\":\"%s\",\"showId\":%d,\"seat\":\"%s\",\"userId\":%d,\"timestamp\":\"%s\"}",
                    finalBooking.getBookingReference(),
                    finalBooking.getShow().getId(),
                    finalBooking.getSeat().getSeatNumber(),
                    finalBooking.getUserId(),
                    java.time.Instant.now().toString()
            );

            // Generate secure Base64 image layout data mapping
            String base64QrImage = qrCodeGeneratorService.generateQrCodeBase64(ticketManifest);
            finalBooking.setQrCodePayload(base64QrImage); // Persist directly into the table context
            
            bookingRepository.save(finalBooking);
            seatRepository.save(finalBooking.getSeat());

            // Save in-app notification
            try {
                String eventTitle = finalBooking.getCustomEventTitle() != null ? finalBooking.getCustomEventTitle().split(":::imageURL:::")[0] : finalBooking.getShow().getEvent().getTitle();
                String seatNum = finalBooking.getSeat().getSeatNumber();
                String messageText = String.format("Your ticket for event '%s' at seat %s is confirmed!", eventTitle, seatNum);
                
                com.example.Ticketizer.features.notification.Notification notification = com.example.Ticketizer.features.notification.Notification.builder()
                        .userId(finalBooking.getUserId())
                        .message(messageText)
                        .type("CONFIRMATION")
                        .isRead(false)
                        .createdAt(java.time.Instant.now())
                        .build();
                notificationRepository.save(notification);
                log.info("In-app notification saved for confirmed booking ID: {}", finalBooking.getBookingReference());
            } catch (Exception ex) {
                log.error("Failed to save in-app notification for confirmed booking: {}", ex.getMessage(), ex);
            }

            // Evict lock registration metadata block cleanly out of Redis memory mapping space
            String lockedHashKey = "show:" + finalBooking.getShow().getId() + ":locked_seats";
            redisTemplate.opsForHash().delete(lockedHashKey, String.valueOf(finalBooking.getSeat().getId()));
            
            log.info("State convergence complete. Secure entry QR token appended to booking reference {}.", finalBooking.getBookingReference());

            if (publishEmail) {
                // Retrieve User details to populate the notification payload
                User user = userRepository.findById(finalBooking.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("User not found for ID: " + finalBooking.getUserId()));

                TicketNotificationEvent notificationEvent = new TicketNotificationEvent(
                        finalBooking.getBookingReference(),
                        user.getEmail(),
                        user.getFullName(),
                        finalBooking.getCustomEventTitle() != null ? finalBooking.getCustomEventTitle() : finalBooking.getShow().getEvent().getTitle(),
                        finalBooking.getSeat().getSeatNumber(),
                        finalBooking.getCustomStartTime() != null ? finalBooking.getCustomStartTime() : (finalBooking.getShow().getStartTime() != null ? finalBooking.getShow().getStartTime().toString() : java.time.Instant.now().toString()),
                        base64QrImage
                );

                // Publish the ticket confirmation event async to Kafka
                notificationPublisherProducer.publishConfrimationEvent(notificationEvent);
            }
        } else {
            // Sad Path: Gateway reports payment failure. Delegate to clear up operations
            log.warn("Payment failed for reference {}. Releasing locked slots back to game loops.", request.bookingReference());
            finalBooking.setStatus(BookingStatus.CANCELLED);
            finalBooking.getSeat().setStatus(SeatStatus.AVAILABLE);
            
            bookingRepository.save(finalBooking);
            seatRepository.save(finalBooking.getSeat());

            // Put capacity back into Redis Sets using our structural components
            String availableSetKey = "show:" + finalBooking.getShow().getId() + ":available_seats";
            String lockedHashKey = "show:" + finalBooking.getShow().getId() + ":locked_seats";
            
            redisTemplate.opsForHash().delete(lockedHashKey, String.valueOf(finalBooking.getSeat().getId()));
            redisTemplate.opsForSet().add(availableSetKey, String.valueOf(finalBooking.getSeat().getId()));
        }
    }

    @Transactional(readOnly = true)
    public void publishUnifiedNotification(String[] references) {
        log.info("Compiling unified email notification for references size: {}", references.length);
        java.util.List<String> seatsList = new java.util.ArrayList<>();
        java.util.List<String> qrCodesList = new java.util.ArrayList<>();
        
        Booking firstBooking = null;
        
        for (String ref : references) {
            Booking booking = bookingRepository.findByBookingReference(ref).orElse(null);
            if (booking != null) {
                if (firstBooking == null) {
                    firstBooking = booking;
                }
                seatsList.add(booking.getSeat().getSeatNumber());
                if (booking.getQrCodePayload() != null) {
                    qrCodesList.add(booking.getQrCodePayload());
                }
            }
        }
        
        if (firstBooking != null) {
            final Booking finalFirstBooking = firstBooking;
            User user = userRepository.findById(finalFirstBooking.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found for ID: " + finalFirstBooking.getUserId()));
                    
            String joinedSeats = String.join(", ", seatsList);
            String joinedQrs = String.join("|", qrCodesList);
            
            TicketNotificationEvent notificationEvent = new TicketNotificationEvent(
                    String.join(",", references),
                    user.getEmail(),
                    user.getFullName(),
                    firstBooking.getCustomEventTitle() != null ? firstBooking.getCustomEventTitle() : firstBooking.getShow().getEvent().getTitle(),
                    joinedSeats,
                    firstBooking.getCustomStartTime() != null ? firstBooking.getCustomStartTime() : (firstBooking.getShow().getStartTime() != null ? firstBooking.getShow().getStartTime().toString() : java.time.Instant.now().toString()),
                    joinedQrs
            );
            
            notificationPublisherProducer.publishConfrimationEvent(notificationEvent);
            log.info("Unified Ticket Confirmation Event Dispatched: Refs: {}", String.join(",", references));
        }
    }

}