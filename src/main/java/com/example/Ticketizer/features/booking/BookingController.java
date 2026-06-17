package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.booking.BookingRepository;
import com.example.Ticketizer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    private final com.example.Ticketizer.features.inventory.SeatRepository seatRepository;
    private final com.example.Ticketizer.features.notification.NotificationRepository notificationRepository;
    private final com.example.Ticketizer.features.notification.EmailService emailService;
    private final com.example.Ticketizer.features.auth.UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid authorization header."));
        }
        
        try {
            String token = authHeader.substring(7);
            Long userId = tokenProvider.getUserIdFromToken(token);
            log.info("Fetching bookings for user ID: {}", userId);
            
            java.util.List<Booking> bookings = bookingRepository.findByUserIdOrderByIdDesc(userId);
            java.util.List<Map<String, Object>> responseList = new java.util.ArrayList<>();
            
            for (Booking booking : bookings) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("bookingReference", booking.getBookingReference() != null ? booking.getBookingReference() : "");
                map.put("status", booking.getStatus() != null ? booking.getStatus().toString() : "PENDING");
                map.put("qrCodePayload", booking.getQrCodePayload() != null ? booking.getQrCodePayload() : "");
                
                String title = "Live Event Booking";
                if (booking.getCustomEventTitle() != null) {
                    title = booking.getCustomEventTitle().split(":::imageURL:::")[0];
                } else if (booking.getShow() != null && booking.getShow().getEvent() != null) {
                    title = booking.getShow().getEvent().getTitle();
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
                } else if (booking.getShow() != null) {
                    venue = booking.getShow().getVenue();
                }
                map.put("venue", venue);
                
                String hallName = "Main Hall";
                if (booking.getShow() != null && booking.getShow().getHallName() != null) {
                    hallName = booking.getShow().getHallName();
                }
                map.put("hallName", hallName);
                
                String seatNumber = "TBA";
                if (booking.getSeat() != null && booking.getSeat().getSeatNumber() != null) {
                    seatNumber = booking.getSeat().getSeatNumber();
                }
                map.put("seatNumber", seatNumber);
                
                Double price = 150.0;
                if (booking.getShow() != null && booking.getShow().getPrice() != null) {
                    price = booking.getShow().getPrice();
                }
                map.put("price", price);
                
                String startTime = "2026-06-01T18:00:00Z";
                if (booking.getCustomStartTime() != null) {
                    startTime = booking.getCustomStartTime();
                } else if (booking.getShow() != null && booking.getShow().getStartTime() != null) {
                    startTime = booking.getShow().getStartTime().toString();
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
        
        Booking booking = bookingRepository.findByBookingReference(bookingRef)
                .orElse(null);
                
        if (booking == null) {
            // Eventual consistency safety: return temporary PENDING if not in DB yet
            log.warn("Booking ref: {} not found in database yet. Returning temporary PENDING context.", bookingRef);
            return ResponseEntity.ok(Map.of(
                "bookingReference", bookingRef,
                "status", "PENDING",
                "qrCodePayload", ""
            ));
        }

        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("bookingReference", booking.getBookingReference() != null ? booking.getBookingReference() : "");
        map.put("status", booking.getStatus() != null ? booking.getStatus().toString() : "PENDING");
        map.put("qrCodePayload", booking.getQrCodePayload() != null ? booking.getQrCodePayload() : "");
        
        String title = "Live Event Booking";
        if (booking.getCustomEventTitle() != null) {
            title = booking.getCustomEventTitle().split(":::imageURL:::")[0];
        } else if (booking.getShow() != null && booking.getShow().getEvent() != null) {
            title = booking.getShow().getEvent().getTitle();
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
        } else if (booking.getShow() != null) {
            venue = booking.getShow().getVenue();
        }
        map.put("venue", venue);
        
        String hallName = "Main Hall";
        if (booking.getShow() != null && booking.getShow().getHallName() != null) {
            hallName = booking.getShow().getHallName();
        }
        map.put("hallName", hallName);
        
        String seatNumber = "TBA";
        if (booking.getSeat() != null && booking.getSeat().getSeatNumber() != null) {
            seatNumber = booking.getSeat().getSeatNumber();
        }
        map.put("seatNumber", seatNumber);
        
        Double price = 150.0;
        if (booking.getShow() != null && booking.getShow().getPrice() != null) {
            price = booking.getShow().getPrice();
        }
        map.put("price", price);
        
        String startTime = "2026-06-01T18:00:00Z";
        if (booking.getCustomStartTime() != null) {
            startTime = booking.getCustomStartTime();
        } else if (booking.getShow() != null && booking.getShow().getStartTime() != null) {
            startTime = booking.getShow().getStartTime().toString();
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
            
            // 1. Update booking status
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            
            // 2. Reclaim seat in Postgres
            var seat = booking.getSeat();
            if (seat != null) {
                seat.setStatus(com.example.Ticketizer.features.inventory.SeatStatus.AVAILABLE);
                seatRepository.save(seat);
                
                // 3. Reclaim seat in Redis
                if (booking.getShow() != null) {
                    boolean evicted = redisEngine.releaseSeat(booking.getShow().getId(), seat.getId());
                    if (evicted) {
                        log.info("Successfully evicted seat ID {} from Redis locked cache for Show ID {}", seat.getId(), booking.getShow().getId());
                    } else {
                        log.warn("Relational status set to AVAILABLE, but seat ID {} was not found in Redis lock space.", seat.getId());
                    }
                }
            }

            // 4. Save in-app notification & send email
            try {
                String eventTitle = booking.getCustomEventTitle() != null ? booking.getCustomEventTitle().split(":::imageURL:::")[0] : (booking.getShow() != null && booking.getShow().getEvent() != null ? booking.getShow().getEvent().getTitle() : "Live Event");
                String seatNum = (booking.getSeat() != null) ? booking.getSeat().getSeatNumber() : "TBA";
                
                // In-app Notification
                String messageText = String.format("Your ticket for event '%s' at seat %s was successfully cancelled.", eventTitle, seatNum);
                com.example.Ticketizer.features.notification.Notification notification = com.example.Ticketizer.features.notification.Notification.builder()
                        .userId(userId)
                        .message(messageText)
                        .type("CANCELLATION")
                        .isRead(false)
                        .createdAt(java.time.Instant.now())
                        .build();
                notificationRepository.save(notification);
                log.info("In-app cancellation notification saved for user: {}", userId);

                // Dispatch Email
                com.example.Ticketizer.features.auth.User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    Double price = (booking.getShow() != null && booking.getShow().getPrice() != null) ? booking.getShow().getPrice() : 150.0;
                    String imageUrl = "";
                    if (booking.getCustomEventTitle() != null && booking.getCustomEventTitle().contains(":::imageURL:::")) {
                        imageUrl = booking.getCustomEventTitle().split(":::imageURL:::")[1];
                    }
                    String startTime = "2026-06-01T18:00:00Z";
                    if (booking.getCustomStartTime() != null) {
                        startTime = booking.getCustomStartTime();
                    } else if (booking.getShow() != null && booking.getShow().getStartTime() != null) {
                        startTime = booking.getShow().getStartTime().toString();
                    }

                    emailService.sendTicketCancellationEmail(
                        user.getEmail(),
                        user.getFullName(),
                        eventTitle,
                        seatNum,
                        booking.getBookingReference(),
                        price,
                        imageUrl,
                        startTime
                    );
                    log.info("Cancellation email sent to: {}", user.getEmail());
                }
            } catch (Exception ex) {
                log.error("Failed to save cancellation notification or send email: {}", ex.getMessage(), ex);
            }
            
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully. Seat has been released."));
        } catch (Exception e) {
            log.error("Failed to cancel booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to cancel booking."));
        }
    }
}