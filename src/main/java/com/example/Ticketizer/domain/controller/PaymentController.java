package com.example.Ticketizer.domain.controller;

import com.example.Ticketizer.domain.dto.PaymentCallbackRequest;
import com.example.Ticketizer.domain.service.PaymentOrderService;
import com.example.Ticketizer.domain.service.PaymentSettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentOrderService orderService;
    private final PaymentSettlementService settlementService;

    @PostMapping("/order/{bookingRef}")
    public ResponseEntity<Map<String, String>> triggerPaymentInitialization(@PathVariable String bookingRef) throws Exception {
        return ResponseEntity.ok(orderService.createRazorpayOrder(bookingRef));
    }

    @PostMapping("/settle/{bookingRef}")
    public ResponseEntity<Map<String, String>> triggerSimulatedSettlement(@PathVariable String bookingRef) {
        String[] references = bookingRef.split(",");
        for (String ref : references) {
            PaymentCallbackRequest request = new PaymentCallbackRequest(
                    ref,
                    "txn_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
                    "SUCCESS"
            );
            settlementService.fulfillOrder(request);
        }
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Simulated settlement complete for booking reference list: " + bookingRef
        ));
    }
}