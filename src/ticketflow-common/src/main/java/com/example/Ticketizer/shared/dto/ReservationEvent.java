package com.example.Ticketizer.shared.dto;

import java.io.Serializable;
import java.time.Instant;

public record ReservationEvent(
        String bookingId,
        Long showId,
        Long seatId,
        Long userId,
        Instant timestamp,
        String eventTitle,
        String venue,
        String startTime
) implements Serializable {}
