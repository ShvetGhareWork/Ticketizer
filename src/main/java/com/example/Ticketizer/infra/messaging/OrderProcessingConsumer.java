package com.example.Ticketizer.infra.messaging;

import com.example.Ticketizer.features.booking.ReservationEvent;
import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.inventory.Show;
import com.example.Ticketizer.features.inventory.Seat;
import com.example.Ticketizer.features.booking.BookingStatus;
import com.example.Ticketizer.features.inventory.SeatStatus;
import com.example.Ticketizer.features.booking.BookingRepository;
import com.example.Ticketizer.features.inventory.SeatRepository;
import com.example.Ticketizer.features.inventory.ShowRepository; // Added import
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderProcessingConsumer {

    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final ShowRepository showRepository; // Added repository
    private final StringRedisTemplate redisTemplate;

    private static final String IDEMPOTENCY_PREFIX = "processed_booking:";

    @KafkaListener(
            topics = "ticket-reservations",
            groupId = "ticketflow-order-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void processTicketReservation(ReservationEvent event, Acknowledgment ack) {
        String idempotencyKey = IDEMPOTENCY_PREFIX + event.bookingId();
        
        log.info("Received reservation event. Key: {}, Show: {}, Seat: {}", 
                event.bookingId(), event.showId(), event.seatId());

        Boolean isNewRecord = redisTemplate.opsForValue().setIfAbsent(
                idempotencyKey, 
                "PROCESSED", 
                Duration.ofDays(1)
        );

        if (Boolean.FALSE.equals(isNewRecord)) {
            log.warn("Duplicate execution threat intercepted for booking ID: {}. Skipping database mutation.", event.bookingId());
            ack.acknowledge();
            return;
        }

        // Verify Redis lock still exists for this user (to prevent race conditions from instant release/deselection)
        String lockedHashKey = "show:" + event.showId() + ":locked_seats";
        String lockOwner = (String) redisTemplate.opsForHash().get(lockedHashKey, String.valueOf(event.seatId()));
        if (lockOwner == null || !lockOwner.equals(String.valueOf(event.userId()))) {
            log.warn("Redis lock has already been evicted or transferred for seat {} on show {}. Skipping relational sync for booking ID: {}",
                    event.seatId(), event.showId(), event.bookingId());
            ack.acknowledge();
            return;
        }

        try {
            persistReservationToStore(event);
            ack.acknowledge();
            log.info("Relational synchronization complete. Committed offset for booking: {}", event.bookingId());
        } catch (Exception ex) {
            log.error("Transactional write system error for booking ID: {}. Evicting idempotency lock.", event.bookingId(), ex);
            redisTemplate.delete(idempotencyKey);
            throw ex;
        }
    }

    @Transactional
    protected void persistReservationToStore(ReservationEvent event) {
        Seat seat = seatRepository.findById(event.seatId())
                .orElseThrow(() -> new IllegalArgumentException("Target seat entity does not exist: " + event.seatId()));

        seat.setStatus(SeatStatus.LOCKED);
        seatRepository.save(seat);

        // Obtain a high-performance database proxy reference without performing a lookup query
        Show showProxy = showRepository.getReferenceById(event.showId());

        Booking booking = Booking.builder()
                .bookingReference(event.bookingId())
                .userId(event.userId())
                .show(showProxy) // Map the proxy reference object
                .seat(seat)      // Map the managed seat object
                .status(BookingStatus.PENDING)
                .createdAt(event.timestamp())
                .customEventTitle(event.eventTitle())
                .customVenue(event.venue())
                .customStartTime(event.startTime())
                .build();

        bookingRepository.save(booking);
    }
}