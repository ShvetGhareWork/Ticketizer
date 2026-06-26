package com.example.Ticketizer.shared.dto;

public record TicketNotificationEvent(
    String bookingId,
    String recipientEmail,
    String userName,
    String showTitle,
    String seatNumber,
    String StartTime,
    String qrCodeBase64
) {}
