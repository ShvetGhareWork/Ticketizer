package com.example.Ticketizer.domain.cache;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RedisReservationEngine {

    private final StringRedisTemplate redisTemplate;
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

    
}