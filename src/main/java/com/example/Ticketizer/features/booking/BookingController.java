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

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid authorization header."));
        }
        
        try {
            String token = authHeader.substring(7);
            Long userId = tokenProvider.getUserIdFromToken(token);
            log.info("Fetching bookings for user ID: {}", userId);
            
            java.util.List<Booking> bookings = bookingRepository.findByUserId(userId);
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
}