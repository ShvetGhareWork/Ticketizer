package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.booking.BookingStatus;
import com.example.Ticketizer.features.inventory.SeatStatus;
import com.example.Ticketizer.features.booking.BookingRepository;
import com.example.Ticketizer.features.inventory.SeatRepository;
import com.example.Ticketizer.features.booking.RedisReservationEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired; // Added import
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor // Still handles br, redisEngine, and seatRepository constructors
@Slf4j
public class ReservationJanitor {

    private final BookingRepository bookingRepository;
    private final RedisReservationEngine redisEngine;
    private final SeatRepository seatRepository;
    
    // REMOVED 'final' to isolate from Lombok constructor generation.
    // Field injection cleanly breaks the circular boot dependency.
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

    @Transactional
    public void reconcileExpiredBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking no longer exists: " + bookingId));

        booking.setStatus(BookingStatus.EXPIRED);
        bookingRepository.save(booking);

        var seat = booking.getSeat();
        seat.setStatus(SeatStatus.AVAILABLE);
        seatRepository.save(seat);

        boolean memoryEvicted = redisEngine.releaseSeat(booking.getShow().getId(), seat.getId());

        if (memoryEvicted) {
            log.info("Successfully reclaimed seat ID: {} for Show ID: {} back to available memory loop.", 
                    seat.getId(), booking.getShow().getId());
        } else {
            log.warn("Relational rollback complete, but seat ID: {} was missing from memory lock space.", seat.getId());
        }
    }
}