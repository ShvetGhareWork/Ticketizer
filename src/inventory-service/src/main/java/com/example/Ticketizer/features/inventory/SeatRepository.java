package com.example.Ticketizer.features.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByShowId(Long showId);
    List<Seat> findByShowIdAndStatus(Long showId, SeatStatus status);
    List<Long> findIdsByShowIdAndStatus(Long showId, SeatStatus status);

    @Modifying
    @Query("UPDATE Seat seat SET seat.status = :status WHERE seat.id IN (:seatIds)")
    int updateStatusForSeats(@Param("seatIds") List<Long> seatIds,
                             @Param("status") SeatStatus status);
}
