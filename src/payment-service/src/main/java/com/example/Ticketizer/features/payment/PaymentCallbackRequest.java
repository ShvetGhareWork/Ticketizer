package com.example.Ticketizer.features.payment;

public record PaymentCallbackRequest(
        String bookingReference,
        String paymentId,
        String paymentStatus
) {}
