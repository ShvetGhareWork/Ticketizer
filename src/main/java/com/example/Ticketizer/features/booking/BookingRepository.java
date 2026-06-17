package com.example.Ticketizer.features.booking;

import com.example.Ticketizer.features.booking.Booking;
import com.example.Ticketizer.features.booking.BookingStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBookingReference(String bookingReference);
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, Instant threshold);
    java.util.Optional<Booking> findByBookingReference(String bookingReference);
    java.util.List<Booking> findByUserIdOrderByIdDesc(Long userId);
}