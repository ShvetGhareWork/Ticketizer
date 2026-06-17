package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.features.booking.ReservationEvent;
import com.example.Ticketizer.features.inventory.SeatStateResponse;
import com.example.Ticketizer.features.booking.RedisReservationEngine;
import com.example.Ticketizer.features.inventory.InventoryWarmUpWorker;
import com.example.Ticketizer.features.inventory.Seat;
import com.example.Ticketizer.features.inventory.SeatStatus;
import com.example.Ticketizer.features.booking.ReservationResponse;
// import com.example.Ticketizer.domain.service.ReservationService;
import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.booking.BookingStatus;
import com.example.Ticketizer.features.booking.BookingRepository;
import com.example.Ticketizer.features.inventory.SeatRepository;
import com.example.Ticketizer.features.inventory.ShowRepository;
import com.example.Ticketizer.features.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Enable CORS for easy local frontend integration
public class ReservationController {

    private final RedisReservationEngine reservationEngine;
    private final KafkaTemplate<String, ReservationEvent> kafkaTemplate;
    private final StringRedisTemplate redisTemplate;
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final ShowRepository showRepository;
    private final InventoryWarmUpWorker inventoryWarmUpWorker;
    private final UserRepository userRepository;
    // private final ReservationService reservationService;
    
    private static final String TOPIC = "ticket-reservations";

    /**
     * Retrieves the comprehensive status map of all seats for a given show,
     * merging database final states (BOOKED) with in-memory Redis lock states (LOCKED).
     */
    @GetMapping("/show/{showId}/seats")
    public ResponseEntity<?> getSeats(@PathVariable Long showId) {
        List<Seat> databaseSeats = seatRepository.findByShowId(showId);
        
        // Fetch all current locked seat IDs from the Redis hash
        String lockedHashKey = "show:" + showId + ":locked_seats";
        Map<Object, Object> lockedSeatsMap = redisTemplate.opsForHash().entries(lockedHashKey);
        
        List<Map<String, Object>> seatList = databaseSeats.stream().map(seat -> {
            String status = seat.getStatus().toString();
            
            // If the seat is temporarily locked in Redis memory space, override DB available status
            if (lockedSeatsMap.containsKey(String.valueOf(seat.getId()))) {
                status = "LOCKED";
            }
            
            Map<String, Object> seatMap = new java.util.HashMap<>();
            seatMap.put("id", String.valueOf(seat.getId()));
            seatMap.put("seatNumber", seat.getSeatNumber());
            seatMap.put("status", status);
            seatMap.put("showId", String.valueOf(seat.getShow().getId()));
            return seatMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(seatList);
    }

    /**
     * Secures a lock lease on a seat.
     */
@PostMapping("/show/{showId}/seat/{seatId}")
public ResponseEntity<?> reserveSeat(
        @PathVariable Long showId,
        @PathVariable Long seatId,
        @RequestParam(required = false) String eventTitle,
        @RequestParam(required = false) String venue,
        @RequestParam(required = false) String startTime,
        org.springframework.security.core.Authentication authentication) {

    // Extract the cryptographically validated identity context straight from principal token
    Long securedUserId = (Long) authentication.getPrincipal();
    
    log.info("Secure fast-path ingress reservation execution loop triggered by User: {} for Event: {}, Venue: {}, StartTime: {}", 
            securedUserId, eventTitle, venue, startTime);

    // 0. Enforce verification check for local manual users
    com.example.Ticketizer.features.auth.User user = userRepository.findById(securedUserId)
            .orElseThrow(() -> new IllegalArgumentException("Authenticated user entity not found: " + securedUserId));
    if ("LOCAL".equals(user.getProvider()) && !user.isVerified()) {
        log.warn("Access Denied: Unverified local user {} attempted to reserve seat {}.", securedUserId, seatId);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "status", "UNVERIFIED",
            "message", "Please verify your account using OTP to unlock ticket bookings."
        ));
    }

    // 1. Attempt Redis Lock
    boolean locked = reservationEngine.attemptReservation(showId, seatId, securedUserId);
    if (!locked) {
        log.warn("Fast-path block: Seat {} for Show {} is already LOCKED or BOOKED.", seatId, showId);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "status", "CONFLICT",
            "message", "Seat is already locked or booked."
        ));
    }

    // 2. Generate Unique Booking Reference UUID
    String bookingId = UUID.randomUUID().toString();

    // 3. Dispatch Async Reservation Event to Kafka
    ReservationEvent event = new ReservationEvent(bookingId, showId, seatId, securedUserId, Instant.now(), eventTitle, venue, startTime);
    
    try {
        kafkaTemplate.send(TOPIC, bookingId, event);
        log.info("Async Event Dispatched: Kafka topic: {}, Booking: {}, Seat: {}", TOPIC, bookingId, seatId);
    } catch (Exception ex) {
        log.error("Kafka publish failure. Rollback Redis lock for Seat: {}", seatId, ex);
        reservationEngine.releaseSeat(showId, seatId);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "status", "ERROR",
            "message", "Failed to dispatch reservation event."
        ));
    }

    // 4. Return Immediate High-Speed Response
    return ResponseEntity.ok(new ReservationResponse(bookingId, "PENDING_CONFIRMATION"));
}

    /**
     * Releases a lock lease on a seat.
     */
    @DeleteMapping("/show/{showId}/seat/{seatId}")
    @Transactional
    public ResponseEntity<?> releaseSeat(
            @PathVariable Long showId,
            @PathVariable Long seatId,
            org.springframework.security.core.Authentication authentication) {
        Long securedUserId = (Long) authentication.getPrincipal();
        log.info("Secure release lock request received for Seat: {} on Show: {} by User: {}", seatId, showId, securedUserId);

        String lockedHashKey = "show:" + showId + ":locked_seats";
        String lockedUser = (String) redisTemplate.opsForHash().get(lockedHashKey, String.valueOf(seatId));

        if (lockedUser == null) {
            log.warn("Release lock fail: Seat {} for Show {} is not locked.", seatId, showId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status", "NOT_FOUND",
                "message", "Seat is not locked."
            ));
        }

        if (!lockedUser.equals(String.valueOf(securedUserId))) {
            log.warn("Release lock unauthorized: User {} tried to release seat {} owned by user {}.", securedUserId, seatId, lockedUser);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", "FORBIDDEN",
                "message", "You do not own the lock on this seat."
            ));
        }

        boolean released = reservationEngine.releaseSeat(showId, seatId);
        if (released) {
            // Revert database status for any pending booking of this show, seat and user.
            List<Booking> userBookings = bookingRepository.findByUserIdOrderByIdDesc(securedUserId);
            for (Booking booking : userBookings) {
                if (booking.getShow().getId().equals(showId) && 
                    booking.getSeat().getId().equals(seatId) && 
                    booking.getStatus() == BookingStatus.PENDING) {
                    
                    booking.setStatus(BookingStatus.EXPIRED);
                    bookingRepository.save(booking);
                    
                    Seat seat = booking.getSeat();
                    seat.setStatus(SeatStatus.AVAILABLE);
                    seatRepository.save(seat);
                    log.info("Relational rollback committed for seat {} on show {} via manual release.", seatId, showId);
                }
            }
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Seat reservation released successfully."
            ));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "ERROR",
                "message", "Failed to release the seat."
            ));
        }
    }

    /**
     * Clears all relational bookings, resets seat statuses to AVAILABLE in PostgreSQL,
     * deletes active Redis locks, and restores the available sets in Redis cache.
     */
    @PostMapping("/flush")
    @Transactional
    public ResponseEntity<?> flushDatabase() {
        log.info("ADMIN WEBHOOK: Triggering bulk database flush and Redis inventory reset...");
        
        // 1. Delete all booking records
        bookingRepository.deleteAllInBatch();
        
        // 2. Delete all user accounts to allow fresh sign-ups
        userRepository.deleteAllInBatch();
        
        // 3. Reset all seats to AVAILABLE in the relational database
        List<Seat> allSeats = seatRepository.findAll();
        for (Seat seat : allSeats) {
            seat.setStatus(SeatStatus.AVAILABLE);
        }
        seatRepository.saveAll(allSeats);
        
        // 3. Delete active lock hashes and available lists in Redis for all seeded shows
        List<com.example.Ticketizer.features.inventory.Show> shows = showRepository.findAll();
        for (com.example.Ticketizer.features.inventory.Show show : shows) {
            String lockedHashKey = "show:" + show.getId() + ":locked_seats";
            String availableSetKey = "show:" + show.getId() + ":available_seats";
            redisTemplate.delete(lockedHashKey);
            redisTemplate.delete(availableSetKey);
            
            // 4. Re-run cache warm-up worker
            inventoryWarmUpWorker.executeWarmUp(show.getId());
        }
        
        log.info("ADMIN WEBHOOK: Relational and memory caches successfully flushed to AVAILABLE.");
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Database successfully flushed. Redis inventory reset to AVAILABLE seats across all shows."
        ));
    }

    public ResponseEntity<List<SeatStateResponse>> getRealTimeSeatStatuses(@PathVariable Long showId) {
        List<SeatStateResponse> seatStatuses = reservationEngine.getRealTimeSeatStatuses(showId);
        return ResponseEntity.ok(seatStatuses);
    }
}