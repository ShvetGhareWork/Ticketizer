package com.example.Ticketizer.seeder;

import com.example.Ticketizer.domain.entity.*;
import com.example.Ticketizer.domain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

// CommandLineRunner: Spring calls run() after the application context is fully
// loaded but before serving any HTTP requests. Perfect for seeding.
//
// The guard `if (eventRepository.count() > 0) return` makes this idempotent —
// restart the app a hundred times, you still get exactly one seeded dataset.
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final EventRepository eventRepository;
    private final ShowRepository showRepository;
    private final SeatRepository seatRepository;

    @Override
    public void run(String... args) {
        if (eventRepository.count() > 0) {
            log.info("Database already seeded — skipping.");
            return;
        }

        log.info("Seeding test data...");

        // ── Create the event ──────────────────────────────────────────────────
        Event event = Event.builder()
                .name("IPL Final 2026 - MI vs CSK")
                .description("The most anticipated cricket match of the year. " +
                             "Mumbai Indians vs Chennai Super Kings at Wankhede.")
                .build();
        event = eventRepository.save(event);

        // ── Create a show 7 days from now ─────────────────────────────────────
        OffsetDateTime showStart = OffsetDateTime.now(ZoneOffset.UTC)
                .plusDays(7)
                .withHour(19)
                .withMinute(30)
                .withSecond(0)
                .withNano(0);

        Show show = Show.builder()
                .event(event)
                .venue("Wankhede Stadium, Mumbai")
                .startTime(showStart)
                .endTime(showStart.plusHours(5))
                .totalCapacity(200)
                .build();
        show = showRepository.save(show);

        // ── Seed 200 seats: 10 rows × 20 seats ───────────────────────────────
        // Rows A & B: premium (₹5000). C–J: standard (₹2500).
        // This mirrors real stadium pricing tiers, which is useful for
        // demonstrating Phase 2's Redis inventory partitioning later.
        String[] rows = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        List<Seat> seats = new ArrayList<>();

        for (String row : rows) {
            BigDecimal price = (row.equals("A") || row.equals("B"))
                    ? BigDecimal.valueOf(5000)
                    : BigDecimal.valueOf(2500);

            for (int num = 1; num <= 20; num++) {
                seats.add(Seat.builder()
                        .show(show)
                        .rowIdentifier(row)
                        .seatNumber(row + num)   // e.g. "A1", "B12"
                        .price(price)
                        .status(SeatStatus.AVAILABLE)
                        .build());
            }
        }

        // saveAll uses a single transaction and batches the INSERTs for performance.
        seatRepository.saveAll(seats);

        log.info("Seeded event '{}' | show at {} | {} seats",
                event.getName(), showStart, seats.size());
        log.info("Show ID: {} — use this in Phase 2 Redis warm-up", show.getId());
    }
}
