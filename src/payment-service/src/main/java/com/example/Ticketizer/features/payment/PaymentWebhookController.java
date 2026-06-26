package com.example.Ticketizer.features.payment;

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

    @Value("${razorpay.webhook.secret:mocksecret123}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String requestBody,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        log.info("Processing inbound cryptographic payload notification from Razorpay...");

        String expectedSignature = new HmacUtils("HmacSHA256", webhookSecret).hmacHex(requestBody);
        
        if (!expectedSignature.equals(signature)) {
            log.error("CRITICAL SECURITY ALARM: Signature validation failed.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid cryptographic signature verification.");
        }

        JSONObject jsonPayload = new JSONObject(requestBody);
        String event = jsonPayload.getString("event");

        if ("order.paid".equals(event)) {
            JSONObject paymentEntity = jsonPayload.getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String bookingReference = paymentEntity.getString("notes");
            String transactionId = paymentEntity.getString("id");

            PaymentCallbackRequest settlementDto = new PaymentCallbackRequest(
                    bookingReference, transactionId, "SUCCESS"
            );

            settlementService.fulfillOrder(settlementDto);
            return ResponseEntity.ok("Fulfillment processed successfully.");
        }

        return ResponseEntity.ok("Event skipped.");
    }
}
