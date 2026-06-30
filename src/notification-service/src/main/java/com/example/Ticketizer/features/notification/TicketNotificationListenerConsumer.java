package com.example.Ticketizer.features.notification;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.Ticketizer.shared.dto.TicketNotificationEvent;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import java.time.Duration;
import java.util.Map;

@Component
@Slf4j
public class TicketNotificationListenerConsumer {
    
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;
    private final NotificationRepository notificationRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${services.booking-service:http://localhost:8083}")
    private String bookingServiceUrl;

    @Value("${services.auth-service:http://localhost:8081}")
    private String authServiceUrl;

    public TicketNotificationListenerConsumer(
            EmailService emailService, 
            StringRedisTemplate redisTemplate,
            NotificationRepository notificationRepository) {
        this.emailService = emailService;
        this.redisTemplate = redisTemplate;
        this.notificationRepository = notificationRepository;
    }

    @KafkaListener(
        topics = "ticket_notifications",
        groupId = "ticket_notification_group",
        containerFactory = "notificationListenerContainerFactory"
    )
    public void consumeTicketEvent(TicketNotificationEvent event, Acknowledgment acknowledgment){
        log.info("Received Ticket Notification Event: {}", event.bookingId());
        
        String key = "processed_notification:" + event.bookingId();
        Boolean isNew = redisTemplate.opsForValue().setIfAbsent(key, "PROCESSED", Duration.ofHours(24));
        
        if (Boolean.FALSE.equals(isNew)) {
            log.warn("Duplicate Ticket Notification Event detected for booking ID: {}. Skipping.", event.bookingId());
            acknowledgment.acknowledge();
            return;
        }

        try {
            // Save in-app confirmation notification
            try {
                Map<?, ?> bookingMap = restTemplate.getForObject(bookingServiceUrl + "/api/v1/bookings/" + event.bookingId(), Map.class);
                if (bookingMap != null && bookingMap.containsKey("userId")) {
                    Long userId = ((Number) bookingMap.get("userId")).longValue();
                    String messageText = String.format("Your ticket for event '%s' at seat %s is confirmed!", event.showTitle(), event.seatNumber());
                    Notification notification = Notification.builder()
                            .userId(userId)
                            .message(messageText)
                            .type("CONFIRMATION")
                            .isRead(false)
                            .build();
                    notificationRepository.save(notification);
                }
            } catch (Exception ex) {
                log.error("Failed to save confirmation in-app notification", ex);
            }

            emailService.sendTicketConfrimationEmail(event);
            acknowledgment.acknowledge();
        } catch (Exception e) {
            redisTemplate.delete(key);
            throw e;
        }
    }

    @KafkaListener(
        topics = "otp-notifications",
        groupId = "ticket_notification_group"
    )
    public void consumeOtpEvent(String message) {
        log.info("Received OTP Notification Event: {}", message);
        try {
            Map<?, ?> payload = objectMapper.readValue(message, Map.class);
            String email = (String) payload.get("email");
            String otp = (String) payload.get("otp");
            log.info("Processing OTP Notification for email: {}", email);
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            log.error("Failed to process OTP notification", e);
        }
    }

    @KafkaListener(
        topics = "notifications-topic",
        groupId = "ticket_notification_group"
    )
    public void consumeCancellationEvent(String message) {
        log.info("Received cancellation notification event: {}", message);
        try {
            Map<?, ?> payload = objectMapper.readValue(message, Map.class);
            Long userId = ((Number) payload.get("userId")).longValue();
            String bookingRef = (String) payload.get("bookingReference");
            String eventTitle = (String) payload.get("eventTitle");
            String seatNum = (String) payload.get("seatNumber");
            String type = (String) payload.get("type");

            if ("CANCELLATION".equals(type)) {
                String messageText = String.format("Your ticket for event '%s' at seat %s was successfully cancelled.", eventTitle, seatNum);
                Notification notification = Notification.builder()
                        .userId(userId)
                        .message(messageText)
                        .type("CANCELLATION")
                        .isRead(false)
                        .build();
                notificationRepository.save(notification);

                try {
                    Map<?, ?> userMap = restTemplate.getForObject(authServiceUrl + "/api/v1/auth/users/" + userId, Map.class);
                    if (userMap != null) {
                        emailService.sendTicketCancellationEmail(
                            (String) userMap.get("email"),
                            (String) userMap.get("fullName"),
                            eventTitle,
                            seatNum,
                            bookingRef,
                            150.0,
                            "",
                            java.time.Instant.now().toString()
                        );
                    }
                } catch (Exception ex) {
                    log.error("Failed to query user for cancellation email", ex);
                }
            }
        } catch (Exception ex) {
            log.error("Failed to process cancellation notification", ex);
        }
    }
}
