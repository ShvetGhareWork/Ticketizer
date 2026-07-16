package com.example.Ticketizer.features.inventory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryWarmUpWorker implements CommandLineRunner {

    private final SeatRepository seatRepository;
    private final ShowRepository showRepository;
    private final StringRedisTemplate redisTemplate;
    
    @Qualifier("warmUpTaskExecutor")
    private final Executor warmUpTaskExecutor;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting concurrent cache warm-up for all shows...");
        List<Show> shows = showRepository.findAll();

        if (shows.isEmpty()) {
            log.warn("No shows found in the database. Cache warm-up skipped.");
            return;
        }

        // Run warmups concurrently using CompletableFuture and our task executor
        List<CompletableFuture<Void>> futures = shows.stream()
                .map(show -> CompletableFuture.runAsync(() -> {
                    log.info("Starting warm-up task on thread '{}' for Show ID: {}", 
                            Thread.currentThread().getName(), show.getId());
                    executeWarmUp(show.getId());
                }, warmUpTaskExecutor))
                .collect(Collectors.toList());

        // Wait for all warm-up tasks to complete before completing application startup
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        log.info("All parallel cache warm-up tasks completed successfully!");
    }

    public void executeWarmUp(Long showId) {
        String availableSeatsKey = "show:" + showId + ":available_seats";

        redisTemplate.delete(availableSeatsKey);

        List<Seat> availableDatabaseSeats = seatRepository.findByShowIdAndStatus(showId, SeatStatus.AVAILABLE);

        if (availableDatabaseSeats.isEmpty()) {
            log.warn("Warm-up skipped: No records found with status 'AVAILABLE' for Show ID: {}", showId);
            return;
        }

        String[] seatIdsToCache = availableDatabaseSeats.stream()
                .map(seat -> String.valueOf(seat.getId()))
                .toArray(String[]::new);

        redisTemplate.opsForSet().add(availableSeatsKey, seatIdsToCache);
        log.info("Cache Warm-up complete. Staged {} seats into memory for Show ID: {}", seatIdsToCache.length, showId);
    }
}