package com.example.Ticketizer.domain.dto;

import java.io.Serializable;
import java.time.Instant;

public record ReservationEvent(
        String bookingId, // Unique tracking UUID generated at ingress
        Long showId,
        Long seatId,
        Long userId,
        Instant timestamp
) implements Serializable {}