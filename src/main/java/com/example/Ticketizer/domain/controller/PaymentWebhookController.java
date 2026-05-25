package com.example.Ticketizer.domain.controller;

import com.example.Ticketizer.domain.dto.PaymentCallbackRequest;
import com.example.Ticketizer.domain.service.PaymentSettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
// removed invalid import: org.springframework.web.bind.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
public class PaymentWebhookController {

    private final PaymentSettlementService settlementService;

    @PostMapping("/webhook")
    public ResponseEntity<String> handlePaymentCallback(@RequestBody PaymentCallbackRequest request) {
        settlementService.fulfillOrder(request);
        return ResponseEntity.ok("Settlement ledger transaction state processed successfully.");
    }
}