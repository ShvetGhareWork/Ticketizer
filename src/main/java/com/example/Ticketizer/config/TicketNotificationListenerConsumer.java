package com.example.Ticketizer.config;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.example.Ticketizer.features.booking.TicketNotificationEvent;
import com.example.Ticketizer.features.notification.EmailService;

import java.time.Duration;

@Component
public class TicketNotificationListenerConsumer {
    
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;

    public TicketNotificationListenerConsumer(EmailService emailService, StringRedisTemplate redisTemplate) {
        this.emailService = emailService;
        this.redisTemplate = redisTemplate;
    }

    @KafkaListener(
        topics = "ticket_notifications",
        groupId = "ticket_notification_group",
        containerFactory = "notificationListenerContainerFactory"
    )
    public void consumeTicketEvent(TicketNotificationEvent event, Acknowledgment acknowledgment){
        System.out.println("Received Ticket Notification Event: " + event.bookingId());
        
        // 1. Consumer Idempotency Check using Redis
        String key = "processed_notification:" + event.bookingId();
        Boolean isNew = redisTemplate.opsForValue().setIfAbsent(key, "PROCESSED", Duration.ofHours(24));
        
        if (Boolean.FALSE.equals(isNew)) {
            System.out.println("WARNING: Duplicate Ticket Notification Event detected for booking ID: " 
                + event.bookingId() + ". Skipping to prevent duplicate emails.");
            acknowledgment.acknowledge(); // Commit offset to avoid reprocessing
            return;
        }

        try {
            // 2. Send the rich HTML email with the QR code
            emailService.sendTicketConfrimationEmail(event);
            
            // 3. Acknowledge message delivery processing success
            acknowledgment.acknowledge();
        } catch (Exception e) {
            // Remove the idempotency key in Redis so that retry attempts are allowed
            redisTemplate.delete(key);
            throw e; // Rethrow exception to trigger container factory's retry backoff and DLQ routing
        }
    }
}
