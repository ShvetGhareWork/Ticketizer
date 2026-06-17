package com.example.Ticketizer.features.booking;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import com.example.Ticketizer.features.inventory.SeatStateResponse;
import com.example.Ticketizer.features.inventory.SeatRepository;
import com.example.Ticketizer.features.inventory.Seat;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedisReservationEngine {

    private final StringRedisTemplate redisTemplate;
    private final SeatRepository seatRepository;
    private DefaultRedisScript<Long> reservationScript;
    private DefaultRedisScript<Long> releaseScript;

    @PostConstruct
    public void init() {
        reservationScript = new DefaultRedisScript<>();
        reservationScript.setLocation(new ClassPathResource("scripts/reserve_seats.lua"));
        reservationScript.setResultType(Long.class);

        releaseScript = new DefaultRedisScript<>();
        releaseScript.setLocation(new ClassPathResource("scripts/release_seats.lua"));
        releaseScript.setResultType(Long.class);
    }

    /**
     * Executes the Lua script to secure a seat allocation inside memory.
     * @return true if the seat was available and has now transitioned to locked.
     */
    public boolean attemptReservation(Long showId, Long seatId, Long userId) {
        String availableSetKey = "show:" + showId + ":available_seats";
        String lockedHashKey = "show:" + showId + ":locked_seats";

        Long executionResult = redisTemplate.execute(
                reservationScript,
                List.of(availableSetKey, lockedHashKey), // Maps to KEYS
                String.valueOf(seatId),                  // Maps to ARGV[1]
                String.valueOf(userId)                   // Maps to ARGV[2]
        );

        return executionResult != null && executionResult == 1L;
    }
    

/**
 * Atomic eviction of a memory lock, restoring the seat back to the available set.
 */
public boolean releaseSeat(Long showId, Long seatId) {
    String availableSetKey = "show:" + showId + ":available_seats";
    String lockedHashKey = "show:" + showId + ":locked_seats";

    Long result = redisTemplate.execute(
            releaseScript,
            List.of(availableSetKey, lockedHashKey),
            String.valueOf(seatId)
    );

    return result != null && result == 1L;
}
public List<SeatStateResponse> getRealTimeSeatStatuses(Long showId) {
    String availableSetKey = "show:" + showId + ":available_seats";
    String lockedHashKey =  "show:" + showId + ":locked_seats";

    // 1. Fetch all available seat IDs and locked seat keys in parallel lookups
    Set<String> availableSeats = redisTemplate.opsForSet().members(availableSetKey);
    Set<Object> lockedSeats = redisTemplate.opsForHash().keys(lockedHashKey);


    // 2. Convert the fetched seat IDs to Long for easier comparison
    Set<Long> availableIds = availableSeats != null ? availableSeats.stream().map(Long::valueOf).collect(Collectors.toSet()) : Set.of();
    Set<Long> lockedIds = lockedSeats != null ? lockedSeats.stream().map(k -> Long.valueOf((String) k)).collect(Collectors.toSet()) : Set.of();

    // Fetch all database seats for this show to get the correct physical layout and sequential IDs
    List<Seat> databaseSeats = seatRepository.findByShowId(showId);
    List<SeatStateResponse> matrix = new ArrayList<>(databaseSeats.size());

    // 2. Compute status maps for the actual physical layout
    for (Seat seat : databaseSeats) {
        long seatId = seat.getId();
        String status;

        if (availableIds.contains(seatId)) {
            status = "AVAILABLE";
        } else if (lockedIds.contains(seatId)) {
            status = "LOCKED";
        } else {
            status = "BOOKED"; // Evicted from both sets means payment was finalized
        }

        matrix.add(new SeatStateResponse(seatId, status));
    }

    return matrix;
}
    
}