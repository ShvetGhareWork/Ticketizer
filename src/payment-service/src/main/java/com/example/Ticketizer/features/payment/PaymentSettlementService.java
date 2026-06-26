package com.example.Ticketizer.features.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentSettlementService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.booking-service:http://localhost:8083}")
    private String bookingServiceUrl;

    public void fulfillOrder(PaymentCallbackRequest request) {
        fulfillOrder(request, true);
    }

    public void fulfillOrder(PaymentCallbackRequest request, boolean publishEmail) {
        log.info("Processing settlement for booking ref: {}. Status: {}, PublishEmail: {}", 
                request.bookingReference(), request.paymentStatus(), publishEmail);

        try {
            Map<String, String> payload = Map.of(
                "bookingReference", request.bookingReference(),
                "paymentStatus", request.paymentStatus()
            );
            restTemplate.postForEntity(bookingServiceUrl + "/api/v1/bookings/fulfill", payload, Map.class);
        } catch (Exception ex) {
            log.error("Failed to forward booking fulfillment to booking-service", ex);
        }
    }

    public void publishUnifiedNotification(String[] references) {
        log.info("Requesting unified notification compile from booking-service for references count: {}", references.length);
        try {
            Map<String, String> payload = Map.of(
                "references", String.join(",", references)
            );
            restTemplate.postForEntity(bookingServiceUrl + "/api/v1/bookings/publish-unified-notification", payload, Map.class);
        } catch (Exception ex) {
            log.error("Failed to forward unified notification request to booking-service", ex);
        }
    }
}
