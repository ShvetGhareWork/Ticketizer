package com.example.Ticketizer.domain.dto;

public record ReservationResponse(
    String bookingId, // Maps to the unique booking_reference UUID string token
    String status     // e.g., "PENDING_CONFIRMATION"
) {}