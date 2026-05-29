package com.example.Ticketizer.infra.database;

import com.example.Ticketizer.features.inventory.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.jdbc.core.JdbcTemplate;

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
    private final com.example.Ticketizer.features.booking.BookingRepository bookingRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("DataSeeder: Clearing existing repository tables for a fresh dynamic venue deployment...");
        
        // Delete in order of dependency to prevent constraint violations
        bookingRepository.deleteAllInBatch();
        seatRepository.deleteAllInBatch();
        showRepository.deleteAllInBatch();
        eventRepository.deleteAllInBatch();

        // Reset PostgreSQL sequences to ensure absolute identity stability across resets
        jdbcTemplate.execute("ALTER SEQUENCE bookings_id_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE seats_id_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE shows_id_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE events_id_seq RESTART WITH 1");

        log.info("DataSeeder: Initializing raw event, show, and cache-pipelined inventory blocks...");

        // 1. Seed Core Events
        Event movieEvent = Event.builder()
                .title("Inception (Re-Release)")
                .genre("Sci-Fi / Thriller")
                .description("A thief who steals corporate secrets through the use of dream-sharing technology.")
                .durationMinutes(148)
                .build();
        eventRepository.save(movieEvent);

        // 2. Seed Three Unique Venues (Stadium, Sphere, Theater)
        Show eveningShow = Show.builder()
                .event(movieEvent)
                .startTime(LocalDateTime.of(2026, 6, 1, 18, 0).atOffset(ZoneOffset.UTC))
                .endTime(LocalDateTime.of(2026, 6, 1, 18, 0).plusMinutes(movieEvent.getDurationMinutes()).atOffset(ZoneOffset.UTC))
                .price(150.00)
                .venue("Narendra Modi Stadium")
                .totalCapacity(336)
                .hallName("Main Pitch Area")
                .build();

        Show nightShow = Show.builder()
                .event(movieEvent)
                .startTime(LocalDateTime.of(2026, 6, 1, 21, 30).atOffset(ZoneOffset.UTC))
                .endTime(LocalDateTime.of(2026, 6, 1, 21, 30).plusMinutes(movieEvent.getDurationMinutes()).atOffset(ZoneOffset.UTC))
                .price(250.00)
                .venue("Las Vegas Sphere")
                .totalCapacity(180)
                .hallName("Immersive Dome")
                .build();

        Show theaterShow = Show.builder()
                .event(movieEvent)
                .startTime(LocalDateTime.of(2026, 6, 2, 19, 0).atOffset(ZoneOffset.UTC))
                .endTime(LocalDateTime.of(2026, 6, 2, 19, 0).plusMinutes(movieEvent.getDurationMinutes()).atOffset(ZoneOffset.UTC))
                .price(80.00)
                .venue("Comedy Club Theater")
                .totalCapacity(72)
                .hallName("Intimate Lounge")
                .build();

        showRepository.save(eveningShow);
        showRepository.save(nightShow);
        showRepository.save(theaterShow);

        // 3. Populate Seats & Execute Atomic Redis Pipelined Generation for each layout
        seedShowSeats(eveningShow, new String[]{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"}, 24);
        seedShowSeats(nightShow, new String[]{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"}, 15);
        seedShowSeats(theaterShow, new String[]{"A", "B", "C", "D", "E", "F"}, 12);

        log.info("DataSeeder: Pipeline initialization complete. Three production schemas stabilized.");
    }

    private void seedShowSeats(Show show, String[] rows, int seatsPerRow) {
        List<Seat> seatsToSave = new ArrayList<>();
        List<String> redisSeatIds = new ArrayList<>();

        for (String row : rows) {
            for (int col = 1; col <= seatsPerRow; col++) {
                String seatNumber = row + col;
                
                Seat seat = Seat.builder()
                        .show(show)
                        .seatNumber(seatNumber)
                        .status(SeatStatus.AVAILABLE)
                        .build();
                
                seatsToSave.add(seat);
            }
        }
        
        // Batch insert to PostgreSQL (which populates the autogenerated database IDs)
        List<Seat> savedSeats = seatRepository.saveAll(seatsToSave);

        // Store the actual database autoincremented IDs in the Redis sets
        for (Seat seat : savedSeats) {
            redisSeatIds.add(String.valueOf(seat.getId()));
        }

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

        log.info("Successfully staged {} relational seat vectors and memory keys for Show ID: {}", redisSeatIds.size(), show.getId());
    }
}