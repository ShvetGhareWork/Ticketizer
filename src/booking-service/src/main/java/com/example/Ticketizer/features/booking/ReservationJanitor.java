package com.example.Ticketizer.features.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationJanitor {

    private final BookingRepository bookingRepository;
    private final RedisReservationEngine redisEngine;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.inventory-service:http://localhost:8082}")
    private String inventoryServiceUrl;
    
    @Autowired
    @Lazy
    private ReservationJanitor self; 

    @Scheduled(fixedRate = 10000) 
    public void sweepExpiredReservations() {
        Instant expirationThreshold = Instant.now().minus(300, ChronoUnit.SECONDS);
        List<Booking> expiredBookings = bookingRepository.findByStatusAndCreatedAtBefore(
                BookingStatus.PENDING, 
                expirationThreshold
        );

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("Janitor Loop: Detected {} expired allocation leases. Initializing eviction protocol.", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            try {
                self.reconcileExpiredBooking(booking.getId()); 
            } catch (Exception ex) {
                log.error("Failed to evict booking ID: {}. Holding for next sweep cycle.", booking.getId(), ex);
            }
        }
    }

    @Async("janitorTaskExecutor")
    @Transactional
    public void reconcileExpiredBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking no longer exists: " + bookingId));

        booking.setStatus(BookingStatus.EXPIRED);
        bookingRepository.save(booking);

        Long seatId = booking.getSeatId();
        
        try {
            restTemplate.put(inventoryServiceUrl + "/api/v1/seats/status?status=AVAILABLE&seatIds=" + seatId, null);
        } catch (Exception ex) {
            log.error("Failed to update seat status to AVAILABLE in inventory-service", ex);
        }

        boolean memoryEvicted = redisEngine.releaseSeat(booking.getShowId(), seatId);

        if (memoryEvicted) {
            log.info("Successfully reclaimed seat ID: {} back to available memory loop.", seatId);
        } else {
            log.warn("Relational rollback complete, but seat ID: {} was missing from memory lock space.", seatId);
        }
    }
}
