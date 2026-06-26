package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.shared.dto.ReservationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderProcessingConsumer {

    private final BookingRepository bookingRepository;
    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.inventory-service:http://localhost:8082}")
    private String inventoryServiceUrl;

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
        // HTTP API call to update status of seat to LOCKED in inventory-service
        try {
            restTemplate.put(inventoryServiceUrl + "/api/v1/seats/status?status=LOCKED&seatIds=" + event.seatId(), null);
        } catch (Exception ex) {
            log.error("Failed to update seat status to LOCKED in inventory-service", ex);
        }

        Booking booking = Booking.builder()
                .bookingReference(event.bookingId())
                .userId(event.userId())
                .showId(event.showId())
                .seatId(event.seatId())
                .status(BookingStatus.PENDING)
                .createdAt(event.timestamp())
                .customEventTitle(event.eventTitle())
                .customVenue(event.venue())
                .customStartTime(event.startTime())
                .build();

        bookingRepository.save(booking);
    }
}
