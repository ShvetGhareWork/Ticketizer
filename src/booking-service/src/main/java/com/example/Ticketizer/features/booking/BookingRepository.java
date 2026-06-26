package com.example.Ticketizer.features.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBookingReference(String bookingReference);
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, Instant threshold);
    Optional<Booking> findByBookingReference(String bookingReference);
    List<Booking> findByUserIdOrderByIdDesc(Long userId);
}
