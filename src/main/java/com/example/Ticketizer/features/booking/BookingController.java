package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.booking.BookingRepository;
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

        return ResponseEntity.ok(Map.of(
            "bookingReference", booking.getBookingReference(),
            "status", booking.getStatus().toString(),
            "qrCodePayload", booking.getQrCodePayload() != null ? booking.getQrCodePayload() : "",
            "eventTitle", booking.getCustomEventTitle() != null ? booking.getCustomEventTitle() : booking.getShow().getEvent().getTitle(),
            "venue", booking.getCustomVenue() != null ? booking.getCustomVenue() : booking.getShow().getVenue(),
            "hallName", booking.getShow().getHallName() != null ? booking.getShow().getHallName() : "",
            "seatNumber", booking.getSeat().getSeatNumber(),
            "price", booking.getShow().getPrice(),
            "startTime", booking.getCustomStartTime() != null ? booking.getCustomStartTime() : booking.getShow().getStartTime().toString()
        ));
    }
}