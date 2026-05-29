package com.example.Ticketizer.features.booking;

import java.io.Serializable;
import java.time.Instant;

public record ReservationEvent(
        String bookingId, // Unique tracking UUID generated at ingress
        Long showId,
        Long seatId,
        Long userId,
        Instant timestamp,
        String eventTitle,
        String venue,
        String startTime
) implements Serializable {}