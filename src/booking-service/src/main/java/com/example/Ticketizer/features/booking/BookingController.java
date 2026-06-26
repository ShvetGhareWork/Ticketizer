package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final JwtTokenProvider tokenProvider;
    private final RedisReservationEngine redisEngine;
    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate = new RestTemplate();
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${services.inventory-service:http://localhost:8082}")
    private String inventoryServiceUrl;

    @Value("${services.auth-service:http://localhost:8081}")
    private String authServiceUrl;

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid authorization header."));
        }
        
        try {
            String token = authHeader.substring(7);
            Long userId = tokenProvider.getUserIdFromToken(token);
            log.info("Fetching bookings for user ID: {}", userId);
            
            List<Booking> bookings = bookingRepository.findByUserIdOrderByIdDesc(userId);
            List<Map<String, Object>> responseList = new ArrayList<>();
            
            for (Booking booking : bookings) {
                Map<String, Object> map = new HashMap<>();
                map.put("bookingReference", booking.getBookingReference() != null ? booking.getBookingReference() : "");
                map.put("status", booking.getStatus() != null ? booking.getStatus().toString() : "PENDING");
                map.put("qrCodePayload", booking.getQrCodePayload() != null ? booking.getQrCodePayload() : "");
                
                String title = "Live Event Booking";
                if (booking.getCustomEventTitle() != null) {
                    title = booking.getCustomEventTitle().split(":::imageURL:::")[0];
                }
                map.put("eventTitle", title);
                
                String imageUrl = "";
                if (booking.getCustomEventTitle() != null && booking.getCustomEventTitle().contains(":::imageURL:::")) {
                    imageUrl = booking.getCustomEventTitle().split(":::imageURL:::")[1];
                }
                map.put("imageUrl", imageUrl);
                
                String venue = "Venue TBA";
                if (booking.getCustomVenue() != null) {
                    venue = booking.getCustomVenue();
                }
                map.put("venue", venue);
                map.put("hallName", "Main Hall");
                map.put("seatNumber", String.valueOf(booking.getSeatId())); // Fallback to seat ID as number or fetch if needed
                map.put("price", 150.0);
                
                String startTime = "2026-06-01T18:00:00Z";
                if (booking.getCustomStartTime() != null) {
                    startTime = booking.getCustomStartTime();
                }
                map.put("startTime", startTime);
                
                responseList.add(map);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            log.error("Failed to fetch my bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to fetch bookings."));
        }
    }

    @GetMapping("/{bookingRef}")
    public ResponseEntity<?> getBookingDetails(@PathVariable String bookingRef) {
        log.info("Fetching booking details for reference: {}", bookingRef);
        
        Booking booking = bookingRepository.findByBookingReference(bookingRef).orElse(null);
        if (booking == null) {
            log.warn("Booking ref: {} not found in database yet. Returning temporary PENDING context.", bookingRef);
            return ResponseEntity.ok(Map.of(
                "bookingReference", bookingRef,
                "status", "PENDING",
                "qrCodePayload", ""
            ));
        }

        Map<String, Object> map = new HashMap<>();
        map.put("bookingReference", booking.getBookingReference() != null ? booking.getBookingReference() : "");
        map.put("status", booking.getStatus() != null ? booking.getStatus().toString() : "PENDING");
        map.put("qrCodePayload", booking.getQrCodePayload() != null ? booking.getQrCodePayload() : "");
        
        String title = "Live Event Booking";
        if (booking.getCustomEventTitle() != null) {
            title = booking.getCustomEventTitle().split(":::imageURL:::")[0];
        }
        map.put("eventTitle", title);
        
        String imageUrl = "";
        if (booking.getCustomEventTitle() != null && booking.getCustomEventTitle().contains(":::imageURL:::")) {
            imageUrl = booking.getCustomEventTitle().split(":::imageURL:::")[1];
        }
        map.put("imageUrl", imageUrl);
        
        String venue = "Venue TBA";
        if (booking.getCustomVenue() != null) {
            venue = booking.getCustomVenue();
        }
        map.put("venue", venue);
        map.put("hallName", "Main Hall");
        
        // Expose seat details by fetching from inventory-service if needed
        String seatNumber = "A" + booking.getSeatId();
        try {
            Map<?, ?> seatMap = restTemplate.getForObject(inventoryServiceUrl + "/api/v1/seats/" + booking.getSeatId(), Map.class);
            if (seatMap != null && seatMap.containsKey("seatNumber")) {
                seatNumber = (String) seatMap.get("seatNumber");
            }
        } catch (Exception ex) {
            log.error("Failed to query seat details from inventory-service", ex);
        }
        map.put("seatNumber", seatNumber);
        map.put("price", 150.0);
        
        String startTime = "2026-06-01T18:00:00Z";
        if (booking.getCustomStartTime() != null) {
            startTime = booking.getCustomStartTime();
        }
        map.put("startTime", startTime);

        return ResponseEntity.ok(map);
    }

    @PostMapping("/{bookingRef}/cancel")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> cancelBooking(
            @PathVariable String bookingRef,
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid authorization header."));
        }
        
        try {
            String token = authHeader.substring(7);
            Long userId = tokenProvider.getUserIdFromToken(token);
            log.info("Requesting cancellation for booking Ref: {} by user ID: {}", bookingRef, userId);
            
            Booking booking = bookingRepository.findByBookingReference(bookingRef).orElse(null);
            if (booking == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Booking not found."));
            }
            
            if (!booking.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized to cancel this booking."));
            }
            
            if (booking.getStatus() == BookingStatus.CANCELLED) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking is already cancelled."));
            }
            
            if (booking.getStatus() == BookingStatus.EXPIRED) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking has expired and cannot be cancelled."));
            }
            
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            
            Long seatId = booking.getSeatId();
            if (seatId != null) {
                try {
                    restTemplate.put(inventoryServiceUrl + "/api/v1/seats/status?status=AVAILABLE&seatIds=" + seatId, null);
                } catch (Exception ex) {
                    log.error("Failed to update seat status to AVAILABLE in inventory-service", ex);
                }
                
                if (booking.getShowId() != null) {
                    boolean evicted = redisEngine.releaseSeat(booking.getShowId(), seatId);
                    if (evicted) {
                        log.info("Successfully evicted seat ID {} from Redis locked cache for Show ID {}", seatId, booking.getShowId());
                    }
                }
            }

            // Publish cancellation notification to Kafka
            try {
                String eventTitle = booking.getCustomEventTitle() != null ? booking.getCustomEventTitle().split(":::imageURL:::")[0] : "Live Event";
                String seatNum = "A" + booking.getSeatId();
                Map<String, Object> eventData = Map.of(
                    "userId", userId,
                    "bookingReference", bookingRef,
                    "eventTitle", eventTitle,
                    "seatNumber", seatNum,
                    "type", "CANCELLATION"
                );
                kafkaTemplate.send("notifications-topic", eventData);
                log.info("Cancellation event queued for user: {}", userId);
            } catch (Exception ex) {
                log.error("Failed to publish cancellation notification event to Kafka: {}", ex.getMessage());
            }
            
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully. Seat has been released."));
        } catch (Exception e) {
            log.error("Failed to cancel booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to cancel booking."));
        }
    }

    @PostMapping("/fulfill")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> fulfillBooking(@RequestBody Map<String, String> request) {
        String bookingReference = request.get("bookingReference");
        String paymentStatus = request.get("paymentStatus");
        
        log.info("Processing fulfillment for booking ref: {}. Status: {}", bookingReference, paymentStatus);
        
        Booking booking = null;
        for (int i = 0; i < 6; i++) {
            var optionalBooking = bookingRepository.findByBookingReference(bookingReference);
            if (optionalBooking.isPresent()) {
                booking = optionalBooking.get();
                break;
            }
            try {
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Booking reference not found."));
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            return ResponseEntity.ok(Map.of("status", "ALREADY_PROCESSED"));
        }

        if ("SUCCESS".equalsIgnoreCase(paymentStatus)) {
            booking.setStatus(BookingStatus.CONFIRMED);
            
            // Set seat status to BOOKED in inventory-service
            try {
                restTemplate.put(inventoryServiceUrl + "/api/v1/seats/status?status=BOOKED&seatIds=" + booking.getSeatId(), null);
            } catch (Exception ex) {
                log.error("Failed to update seat status to BOOKED in inventory-service", ex);
            }

            // Generate QR Code payload
            String ticketManifest = String.format(
                    "{\"ref\":\"%s\",\"showId\":%d,\"seatId\":%d,\"userId\":%d,\"timestamp\":\"%s\"}",
                    booking.getBookingReference(),
                    booking.getShowId(),
                    booking.getSeatId(),
                    booking.getUserId(),
                    java.time.Instant.now().toString()
            );

            try {
                com.example.Ticketizer.shared.utils.QrCodeGeneratorService qrService = new com.example.Ticketizer.shared.utils.QrCodeGeneratorService();
                String base64QrImage = qrService.generateQrCodeBase64(ticketManifest);
                booking.setQrCodePayload(base64QrImage);
            } catch (Exception ex) {
                log.error("Failed to generate QR code", ex);
            }

            bookingRepository.save(booking);

            // Clean up Redis lock
            String lockedHashKey = "show:" + booking.getShowId() + ":locked_seats";
            redisTemplate.opsForHash().delete(lockedHashKey, String.valueOf(booking.getSeatId()));

            // Send notification event via Kafka
            try {
                Map<?, ?> userMap = restTemplate.getForObject(authServiceUrl + "/api/v1/auth/users/" + booking.getUserId(), Map.class);
                if (userMap != null) {
                    Map<String, Object> eventData = Map.of(
                        "bookingId", booking.getBookingReference(),
                        "recipientEmail", userMap.get("email"),
                        "userName", userMap.get("fullName"),
                        "showTitle", booking.getCustomEventTitle() != null ? booking.getCustomEventTitle() : "Live Event",
                        "seatNumber", "A" + booking.getSeatId(),
                        "startTime", booking.getCustomStartTime() != null ? booking.getCustomStartTime() : Instant.now().toString(),
                        "qrCodeBase64", booking.getQrCodePayload() != null ? booking.getQrCodePayload() : ""
                    );
                    kafkaTemplate.send("ticket_notifications", eventData);
                }
            } catch (Exception ex) {
                log.error("Failed to dispatch confirmation email event", ex);
            }
        } else {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);

            try {
                restTemplate.put(inventoryServiceUrl + "/api/v1/seats/status?status=AVAILABLE&seatIds=" + booking.getSeatId(), null);
            } catch (Exception ex) {
                log.error("Failed to update seat status to AVAILABLE", ex);
            }

            String availableSetKey = "show:" + booking.getShowId() + ":available_seats";
            String lockedHashKey = "show:" + booking.getShowId() + ":locked_seats";
            redisTemplate.opsForHash().delete(lockedHashKey, String.valueOf(booking.getSeatId()));
            redisTemplate.opsForSet().add(availableSetKey, String.valueOf(booking.getSeatId()));
        }

        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    @PostMapping("/publish-unified-notification")
    public ResponseEntity<?> publishUnifiedNotification(@RequestBody Map<String, String> request) {
        String referencesString = request.get("references");
        String[] references = referencesString.split(",");
        log.info("Unified notification for references: {}", referencesString);

        List<String> seatsList = new ArrayList<>();
        List<String> qrCodesList = new ArrayList<>();
        Booking firstBooking = null;

        for (String ref : references) {
            Booking booking = bookingRepository.findByBookingReference(ref).orElse(null);
            if (booking != null) {
                if (firstBooking == null) {
                    firstBooking = booking;
                }
                seatsList.add("A" + booking.getSeatId());
                if (booking.getQrCodePayload() != null) {
                    qrCodesList.add(booking.getQrCodePayload());
                }
            }
        }

        if (firstBooking != null) {
            try {
                Map<?, ?> userMap = restTemplate.getForObject(authServiceUrl + "/api/v1/auth/users/" + firstBooking.getUserId(), Map.class);
                if (userMap != null) {
                    Map<String, Object> eventData = Map.of(
                        "bookingId", String.join(",", references),
                        "recipientEmail", userMap.get("email"),
                        "userName", userMap.get("fullName"),
                        "showTitle", firstBooking.getCustomEventTitle() != null ? firstBooking.getCustomEventTitle() : "Live Event",
                        "seatNumber", String.join(", ", seatsList),
                        "startTime", firstBooking.getCustomStartTime() != null ? firstBooking.getCustomStartTime() : Instant.now().toString(),
                        "qrCodeBase64", String.join("|", qrCodesList)
                    );
                    kafkaTemplate.send("ticket_notifications", eventData);
                }
            } catch (Exception ex) {
                log.error("Failed to publish unified notification", ex);
            }
        }

        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }
}
