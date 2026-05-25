package com.example.Ticketizer.domain.controller;

import com.example.Ticketizer.domain.dto.ReservationEvent;
import com.example.Ticketizer.domain.cache.RedisReservationEngine;
import com.example.Ticketizer.domain.cache.InventoryWarmUpWorker;
import com.example.Ticketizer.domain.entity.Seat;
import com.example.Ticketizer.domain.entity.SeatStatus;
import com.example.Ticketizer.domain.repository.BookingRepository;
import com.example.Ticketizer.domain.repository.SeatRepository;
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
    private final InventoryWarmUpWorker inventoryWarmUpWorker;
    
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
            seatMap.put("row", seat.getRowIdentifier());
            seatMap.put("status", status);
            seatMap.put("price", seat.getPrice());
            return seatMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(seatList);
    }

    /**
     * Secures a lock lease on a seat.
     */
    @PostMapping("/show/{showId}/seat/{seatId}")
    public ResponseEntity<?> processReservation(
            @PathVariable Long showId,
            @PathVariable Long seatId,
            @RequestParam Long userId) {

        // 1. Evaluate reservation availability atomically within Redis memory loop
        boolean success = reservationEngine.attemptReservation(showId, seatId, userId);

        if (success) {
            String bookingId = UUID.randomUUID().toString();
            
            ReservationEvent event = new ReservationEvent(
                    bookingId,
                    showId,
                    seatId,
                    userId,
                    Instant.now()
            );

            // 2. Fire payload into the asynchronous Kafka broker stream
            kafkaTemplate.send(TOPIC, String.valueOf(showId), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Dispatched event successfully to partition [{}] for booking: {}", 
                                result.getRecordMetadata().partition(), bookingId);
                    } else {
                        log.error("Critical: Failed to stream booking event: {}", bookingId, ex);
                    }
                });

            return ResponseEntity.ok(Map.of(
                    "status", "PENDING_CONFIRMATION",
                    "bookingId", bookingId,
                    "message", "Seat allocation secured. Order processing initialized."
            ));
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "status", "REJECTED",
                    "message", "Seat unavailable or already locked."
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
        
        // 2. Reset all seats to AVAILABLE in the relational database
        List<Seat> allSeats = seatRepository.findAll();
        for (Seat seat : allSeats) {
            seat.setStatus(SeatStatus.AVAILABLE);
        }
        seatRepository.saveAll(allSeats);
        
        // 3. Delete active lock hashes and available lists in Redis
        Long showId = 1L;
        String lockedHashKey = "show:" + showId + ":locked_seats";
        String availableSetKey = "show:" + showId + ":available_seats";
        redisTemplate.delete(lockedHashKey);
        redisTemplate.delete(availableSetKey);
        
        // 4. Re-run cache warm-up worker to load the newly available seats into Redis Set
        inventoryWarmUpWorker.executeWarmUp(showId);
        
        log.info("ADMIN WEBHOOK: Relational and memory caches successfully flushed to AVAILABLE.");
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Database successfully flushed. Redis inventory reset to 200 AVAILABLE seats."
        ));
    }
}