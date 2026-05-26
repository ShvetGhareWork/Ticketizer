package com.example.Ticketizer.features.payment;

public record PaymentCallbackRequest(
    String bookingReference,
    String paymentTransactionId,
    String paymentStatus // e.g., "SUCCESS", "FAILED"
) {}