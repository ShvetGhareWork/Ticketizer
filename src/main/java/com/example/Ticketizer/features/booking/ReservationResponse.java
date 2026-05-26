package com.example.Ticketizer.features.booking;

public record ReservationResponse(
    String bookingId, // Maps to the unique booking_reference UUID string token
    String status     // e.g., "PENDING_CONFIRMATION"
) {}