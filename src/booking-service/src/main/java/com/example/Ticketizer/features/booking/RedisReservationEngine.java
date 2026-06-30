package com.example.Ticketizer.features.booking;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
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

    public boolean attemptReservation(Long showId, Long seatId, Long userId) {
        String availableSetKey = "show:" + showId + ":available_seats";
        String lockedHashKey = "show:" + showId + ":locked_seats";
        
        log.info("Attempting reservation - Keys: [{}, {}], Seat: {}, User: {}", 
                availableSetKey, lockedHashKey, seatId, userId);

        try {
            Long executionResult = redisTemplate.execute(
                    reservationScript,
                    List.of(availableSetKey, lockedHashKey),
                    String.valueOf(seatId),
                    String.valueOf(userId)
            );

            log.info("Reservation Lua script execution result: {} for Seat: {}", executionResult, seatId);
            return executionResult != null && executionResult == 1L;
        } catch (Exception ex) {
            log.error("Failed executing reserve_seats Lua script for Seat: {}", seatId, ex);
            return false;
        }
    }

    public boolean releaseSeat(Long showId, Long seatId) {
        String availableSetKey = "show:" + showId + ":available_seats";
        String lockedHashKey = "show:" + showId + ":locked_seats";

        log.info("Releasing seat - Keys: [{}, {}], Seat: {}", 
                availableSetKey, lockedHashKey, seatId);

        try {
            Long result = redisTemplate.execute(
                    releaseScript,
                    List.of(availableSetKey, lockedHashKey),
                    String.valueOf(seatId)
            );

            log.info("Release Lua script execution result: {} for Seat: {}", result, seatId);
            return result != null && result == 1L;
        } catch (Exception ex) {
            log.error("Failed executing release_seats Lua script for Seat: {}", seatId, ex);
            return false;
        }
    }
}
