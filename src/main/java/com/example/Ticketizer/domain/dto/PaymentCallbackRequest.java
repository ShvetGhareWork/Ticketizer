package com.example.Ticketizer.domain.dto;

public record PaymentCallbackRequest(
    String bookingReference,
    String paymentTransactionId,
    String paymentStatus // e.g., "SUCCESS", "FAILED"
) {}