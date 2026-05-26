package com.example.Ticketizer.features.inventory;

// Mirrors the PostgreSQL ENUM type 'seat_status'.
// Values must match EXACTLY (case-sensitive) — PostgreSQL ENUM values are case-sensitive.
// If you rename AVAILABLE to Available, you'll get a DataIntegrityViolationException.
public enum SeatStatus {
    AVAILABLE,  // In Redis available set. Anyone can lock it.
    LOCKED,     // Reserved via Lua script. Awaiting payment. Has a TTL.
    BOOKED      // Payment confirmed. Written to DB. Final state.
}