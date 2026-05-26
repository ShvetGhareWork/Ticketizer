package com.example.Ticketizer.features.payment;

import com.example.Ticketizer.features.payment.PaymentCallbackRequest;
import com.example.Ticketizer.features.payment.PaymentSettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacUtils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final PaymentSettlementService settlementService;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String requestBody,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        log.info("Processing inbound cryptographic payload notification from Razorpay...");

        // 1. Verify webhook signature authenticity using HMAC-SHA256 algorithm validation
        String expectedSignature = new HmacUtils("HmacSHA256", webhookSecret).hmacHex(requestBody);
        
        if (!expectedSignature.equals(signature)) {
            log.error("CRITICAL SECURITY ALARM: Signature validation failed. Unauthorized entity rejected.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid cryptographic signature verification.");
        }

        // 2. Parse payload extraction maps
        JSONObject jsonPayload = new JSONObject(requestBody);
        String event = jsonPayload.getString("event");

        if ("order.paid".equals(event)) {
            JSONObject paymentEntity = jsonPayload.getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String bookingReference = paymentEntity.getString("notes"); // Or extract from order attributes maps
            String transactionId = paymentEntity.getString("id");

            PaymentCallbackRequest settlementDto = new PaymentCallbackRequest(
                    bookingReference, transactionId, "SUCCESS"
            );

            // 3. Delegate state convergence into core transactional domain logic blocks
            settlementService.fulfillOrder(settlementDto);
            return ResponseEntity.ok("Fulfillment processed successfully.");
        }

        return ResponseEntity.ok("Event skipped.");
    }
}