package com.example.Ticketizer.infra.database;

import com.example.Ticketizer.features.inventory.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final EventRepository eventRepository;
    private final ShowRepository showRepository;
    private final SeatRepository seatRepository;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (eventRepository.count() > 0) {
            log.info("DataSeeder: Core storage structures contain existing matrices. Skipping generation loop.");
            return;
        }

        log.info("DataSeeder: Initializing raw event, show, and cache-pipelined inventory blocks...");

        // 1. Seed Core Events
        Event movieEvent = Event.builder()
                .title("Inception (Re-Release)")
                .genre("Sci-Fi / Thriller")
                .description("A thief who steals corporate secrets through the use of dream-sharing technology.")
                .durationMinutes(148)
                .build();
        eventRepository.save(movieEvent);

        // ... Inside your DataSeeder.java run() method, modify the Show builders:

Show eveningShow = Show.builder()
        .event(movieEvent)
        .startTime(LocalDateTime.of(2026, 6, 1, 18, 0).atOffset(ZoneOffset.UTC))
        .endTime(LocalDateTime.of(2026, 6, 1, 18, 0).plusMinutes(movieEvent.getDurationMinutes()).atOffset(ZoneOffset.UTC)) // Added field mapping
        .price(350.00)
        .venue("Grand Cinema Noir")
        .totalCapacity(200)
        .hallName("Screen 1 / IMAX")
        .build();

Show nightShow = Show.builder()
        .event(movieEvent)
        .startTime(LocalDateTime.of(2026, 6, 1, 21, 30).atOffset(ZoneOffset.UTC))
        .endTime(LocalDateTime.of(2026, 6, 1, 21, 30).plusMinutes(movieEvent.getDurationMinutes()).atOffset(ZoneOffset.UTC)) // Added field mapping
        .price(400.00)
        .venue("Grand Cinema Noir")
        .totalCapacity(200)
        .hallName("Screen 1 / IMAX")
        .build();

        showRepository.save(eveningShow);
        showRepository.save(nightShow);

        // 3. Populate Seats & Execute Atomic Redis Pipelined Generation
        seedShowSeats(eveningShow);
        seedShowSeats(nightShow);

        log.info("DataSeeder: Pipeline initialization complete. Production schema stabilized.");
    }

    private void seedShowSeats(Show show) {
        String[] rows = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        int seatsPerRow = 20;
        List<Seat> seatsToSave = new ArrayList<>();
        List<String> redisSeatIds = new ArrayList<>();

        int globalIdCounter = 1;
        for (String row : rows) {
            for (int col = 1; col <= seatsPerRow; col++) {
                String seatNumber = row + col;
                
                Seat seat = Seat.builder()
                        .show(show)
                        .seatNumber(seatNumber)
                        .status(SeatStatus.AVAILABLE)
                        .build();
                
                seatsToSave.add(seat);
                
                // Store the logical string index for Redis sets (sequential 1-200)
                redisSeatIds.add(String.valueOf(globalIdCounter++));
            }
        }
        
        // Batch insert to PostgreSQL
        seatRepository.saveAll(seatsToSave);

        // Batch inject inventory tokens into Redis Sets using high-speed pipelining
        String availableSetKey = "show:" + show.getId() + ":available_seats";
        
        redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            byte[] rawKey = redisTemplate.getStringSerializer().serialize(availableSetKey);
            for (String seatId : redisSeatIds) {
                byte[] rawValue = redisTemplate.getStringSerializer().serialize(seatId);
                connection.setCommands().sAdd(rawKey, rawValue);
            }
            return null;
        });

        log.info("Successfully staged 200 relational seat vectors and memory keys for Show ID: {}", show.getId());
    }
}