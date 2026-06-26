package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.shared.dto.ReservationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReservationController {

    private final RedisReservationEngine reservationEngine;
    private final KafkaTemplate<String, ReservationEvent> kafkaTemplate;
    private final StringRedisTemplate redisTemplate;
    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.auth-service:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.inventory-service:http://localhost:8082}")
    private String inventoryServiceUrl;
    
    private static final String TOPIC = "ticket-reservations";

    @PostMapping("/show/{showId}/seat/{seatId}")
    public ResponseEntity<?> reserveSeat(
            @PathVariable Long showId,
            @PathVariable Long seatId,
            @RequestParam(required = false) String eventTitle,
            @RequestParam(required = false) String venue,
            @RequestParam(required = false) String startTime,
            org.springframework.security.core.Authentication authentication) {

        Long securedUserId = (Long) authentication.getPrincipal();
        
        log.info("Secure fast-path reservation. User: {}, Show: {}, Seat: {}", 
                securedUserId, showId, seatId);

        try {
            // Check user verification status via auth-service
            Map<?, ?> userMap = restTemplate.getForObject(authServiceUrl + "/api/v1/auth/users/" + securedUserId, Map.class);
            if (userMap == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", "UNVERIFIED",
                    "message", "Please verify your account."
                ));
            }
        } catch (Exception ex) {
            log.error("Failed to check user verification with auth-service", ex);
        }

        boolean locked = reservationEngine.attemptReservation(showId, seatId, securedUserId);
        if (!locked) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "status", "CONFLICT",
                "message", "Seat is already locked or booked."
            ));
        }

        String bookingId = UUID.randomUUID().toString();
        ReservationEvent event = new ReservationEvent(bookingId, showId, seatId, securedUserId, Instant.now(), eventTitle, venue, startTime);
        
        try {
            kafkaTemplate.send(TOPIC, bookingId, event);
            log.info("Async Event Dispatched: {}", bookingId);
        } catch (Exception ex) {
            log.error("Kafka publish failure. Rollback Redis lock for Seat: {}", seatId, ex);
            reservationEngine.releaseSeat(showId, seatId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "ERROR",
                "message", "Failed to dispatch reservation event."
            ));
        }

        return ResponseEntity.ok(new ReservationResponse(bookingId, "PENDING_CONFIRMATION"));
    }

    @DeleteMapping("/show/{showId}/seat/{seatId}")
    @Transactional
    public ResponseEntity<?> releaseSeat(
            @PathVariable Long showId,
            @PathVariable Long seatId,
            org.springframework.security.core.Authentication authentication) {
        Long securedUserId = (Long) authentication.getPrincipal();
        log.info("Release lock request for Seat: {}, Show: {}, User: {}", seatId, showId, securedUserId);

        String lockedHashKey = "show:" + showId + ":locked_seats";
        String lockedUser = (String) redisTemplate.opsForHash().get(lockedHashKey, String.valueOf(seatId));

        if (lockedUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status", "NOT_FOUND",
                "message", "Seat is not locked."
            ));
        }

        if (!lockedUser.equals(String.valueOf(securedUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", "FORBIDDEN",
                "message", "You do not own the lock on this seat."
            ));
        }

        boolean released = reservationEngine.releaseSeat(showId, seatId);
        if (released) {
            List<Booking> userBookings = bookingRepository.findByUserIdOrderByIdDesc(securedUserId);
            for (Booking booking : userBookings) {
                if (booking.getShowId().equals(showId) && 
                    booking.getSeatId().equals(seatId) && 
                    booking.getStatus() == BookingStatus.PENDING) {
                    
                    booking.setStatus(BookingStatus.EXPIRED);
                    bookingRepository.save(booking);
                    
                    try {
                        restTemplate.put(inventoryServiceUrl + "/api/v1/seats/status?status=AVAILABLE&seatIds=" + seatId, null);
                    } catch (Exception ex) {
                        log.error("Failed to update seat status to AVAILABLE in inventory-service", ex);
                    }
                    log.info("Relational rollback committed for seat {} via manual release.", seatId);
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
}
