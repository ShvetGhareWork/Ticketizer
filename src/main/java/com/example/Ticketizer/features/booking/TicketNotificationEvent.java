package com.example.Ticketizer.features.booking;

public record TicketNotificationEvent(
    String bookingId,
    String recipientEmail,
    String userName,
    String showTitle,
    String seatNumber,
    String StartTime,
    String qrCodeBase64
) {}