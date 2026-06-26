package com.example.Ticketizer.features.inventory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class InventoryController {

    private final EventRepository eventRepository;
    private final ShowRepository showRepository;
    private final SeatRepository seatRepository;
    private final RedisReservationEngine reservationEngine;

    @GetMapping("/events")
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/shows/{showId}")
    public ResponseEntity<Show> getShowById(@PathVariable Long showId) {
        return showRepository.findById(showId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"/shows/{showId}/seats", "/reservations/show/{showId}/seats"})
    public ResponseEntity<List<SeatStateResponse>> getSeats(@PathVariable Long showId) {
        return ResponseEntity.ok(reservationEngine.getRealTimeSeatStatuses(showId));
    }

    @PutMapping("/seats/status")
    @Transactional
    public ResponseEntity<?> updateSeatsStatus(
            @RequestParam List<Long> seatIds,
            @RequestParam SeatStatus status) {
        log.info("Updating status of seats {} to {}", seatIds, status);
        int updated = seatRepository.updateStatusForSeats(seatIds, status);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "updatedCount", updated
        ));
    }

    @GetMapping("/seats/{seatId}")
    public ResponseEntity<?> getSeatById(@PathVariable Long seatId) {
        return seatRepository.findById(seatId)
                .map(seat -> ResponseEntity.ok(Map.of(
                        "id", seat.getId(),
                        "seatNumber", seat.getSeatNumber(),
                        "status", seat.getStatus().toString(),
                        "showId", seat.getShow().getId()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
