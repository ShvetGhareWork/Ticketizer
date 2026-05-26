package com.example.Ticketizer.features.inventory;

import com.example.Ticketizer.features.inventory.Seat;
import com.example.Ticketizer.features.inventory.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Fetch all seats associated with a specific show
    List<Seat> findByShowId(Long showId);

    // Used in Phase 2: the Redis warm-up worker calls this to load all available
    // seat IDs for a show into a Redis Set before the show goes live.
    // Hits the composite index idx_seat_show_status.
    List<Seat> findByShowIdAndStatus(Long showId, SeatStatus status);

    // Used in Phase 5: the expiration engine needs to find all LOCKED seats for
    // a show and determine which ones have expired bookings.
    // Also hits idx_seat_show_status.
    List<Long> findIdsByShowIdAndStatus(Long showId, SeatStatus status);

    // Bulk status update used by the Kafka consumer (Phase 4).
    // @Modifying: required for UPDATE/DELETE queries — tells Hibernate this
    // is not a SELECT and to clear the first-level cache after execution.
    // @Query with JPQL: 'seat' refers to the entity alias, not the table name.
    // We use IN (:seatIds) to update multiple seats in one round-trip.
    @Modifying
    @Query("UPDATE Seat seat SET seat.status = :status WHERE seat.id IN (:seatIds)")
    int updateStatusForSeats(@Param("seatIds") List<Long> seatIds,
                             @Param("status") SeatStatus status);
}