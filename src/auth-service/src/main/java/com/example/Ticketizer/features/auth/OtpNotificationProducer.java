package com.example.Ticketizer.features.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpNotificationProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "otp-notifications";

    public void sendOtp(String email, String otp) {
        log.info("Publishing OTP request to Kafka for email: {}", email);
        try {
            Map<String, String> payload = Map.of(
                "email", email,
                "otp", otp
            );
            kafkaTemplate.send(TOPIC, payload);
        } catch (Exception e) {
            log.error("Failed to publish OTP event to Kafka", e);
        }
    }
}
