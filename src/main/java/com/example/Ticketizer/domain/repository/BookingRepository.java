package com.example.Ticketizer.domain.repository;

import com.example.Ticketizer.domain.entity.Booking;
import com.example.Ticketizer.domain.entity.BookingStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBookingReference(String bookingReference);
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, Instant threshold);
    java.util.Optional<Booking> findByBookingReference(String bookingReference);
}