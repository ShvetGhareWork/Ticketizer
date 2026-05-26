package com.example.Ticketizer.features.inventory;

import com.example.Ticketizer.features.inventory.Seat;
import com.example.Ticketizer.features.inventory.SeatStatus;
import com.example.Ticketizer.features.inventory.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryWarmUpWorker implements CommandLineRunner {

    private final SeatRepository seatRepository;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Staging Show ID 1 to verify execution engine functionality
        Long initialTestShowId = 1L;
        executeWarmUp(initialTestShowId);
    }

    public void executeWarmUp(Long showId) {
        String availableSeatsKey = "show:" + showId + ":available_seats";

        // Flush any stale memory segments to maintain cache consistency
        redisTemplate.delete(availableSeatsKey);

        List<Seat> availableDatabaseSeats = seatRepository.findByShowIdAndStatus(showId, SeatStatus.AVAILABLE);

        if (availableDatabaseSeats.isEmpty()) {
            log.warn("Warm-up skipped: No records found with status 'AVAILABLE' for Show ID: {}", showId);
            return;
        }

        String[] seatIdsToCache = availableDatabaseSeats.stream()
                .map(seat -> String.valueOf(seat.getId()))
                .toArray(String[]::new);

        // Batch push to the Redis Set in a single round-trip
        redisTemplate.opsForSet().add(availableSeatsKey, seatIdsToCache);
        log.info("Cache Warm-up complete. Staged {} seats into memory for Show ID: {}", seatIdsToCache.length, showId);
    }
}