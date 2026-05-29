package com.example.Ticketizer.config;

import com.example.Ticketizer.features.booking.ReservationEvent;
import com.example.Ticketizer.features.booking.TicketNotificationEvent;
import org.springframework.util.backoff.ExponentialBackOff;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.TopicPartition; // ── FIXED: Added Missing Core Import
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
// import org.springframework.kafka.listener.KafkaExceptionLogLevel;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerConfig.class);

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ReservationEvent> kafkaListenerContainerFactory(
            KafkaTemplate<String, ReservationEvent> kafkaTemplate) {
        
        ConcurrentKafkaListenerContainerFactory<String, ReservationEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);

        // 1. Configure the DLQ Recoverer
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> {
                    log.error("Pipeline Failure: Routing deterministic or exhausted event to DLQ.");
                    return new TopicPartition(record.topic() + ".DLT", record.partition());
                });

        // 2. Establish Fixed Backoff Strategy for legitimate transient errors
        FixedBackOff backOff = new FixedBackOff(2000L, 3); // 3 attempts, 2 seconds apart

        // 3. Bind to the DefaultErrorHandler
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);
        errorHandler.setLogLevel(org.springframework.kafka.KafkaException.Level.INFO); // <--- ALIGNED LOG TYPE
        // ── SURGICAL RESILIENCE ADDITION ──────────────────────────────────────
        // Add explicit exception classification to avoid retrying data state errors
        errorHandler.addNotRetryableExceptions(
                org.springframework.dao.DataIntegrityViolationException.class,
                jakarta.persistence.EntityNotFoundException.class,
                IllegalArgumentException.class
        );
        // ──────────────────────────────────────────────────────────────────────

        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }

    @Bean
    public ConsumerFactory<String, ReservationEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ticketizer-group");

        // Configure the deserializer strictly via explicit programmatic setters
        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        
        JsonDeserializer<ReservationEvent> jsonDeserializer = new JsonDeserializer<>(ReservationEvent.class, objectMapper);
        jsonDeserializer.addTrustedPackages("com.example.Ticketizer.features.booking");
        jsonDeserializer.setUseTypeHeaders(false);

        // Passing the instances directly bypasses properties reflection parsing loops entirely
        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                jsonDeserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TicketNotificationEvent> notificationListenerContainerFactory(
            KafkaTemplate<String, Object> kafkatemplate) {
        
        ConcurrentKafkaListenerContainerFactory<String, TicketNotificationEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(notificationConsumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        factory.setConcurrency(6); // Concurrency set to 6 as requested!

        // 1. Configure the DLQ Recoverer (routes exhausted notifications to ticket_notifications.DLT)
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkatemplate,
                (record, ex) -> {
                    log.error("Notification pipeline failure: Routing deterministic/exhausted notification event to DLQ.");
                    return new TopicPartition("ticket_notifications.DLT", record.partition());
                });

        // 2. Establish Exponential Backoff: initial 2s, multiplier 2.0, max 3 attempts
        org.springframework.util.backoff.ExponentialBackOff backOff = new org.springframework.util.backoff.ExponentialBackOff();
        backOff.setInitialInterval(2000L);
        backOff.setMultiplier(2.0);
        backOff.setMaxElapsedTime(10000L); // maximum 10 seconds total elapsed time for attempts

        // 3. Bind to the DefaultErrorHandler
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);
        errorHandler.setLogLevel(org.springframework.kafka.KafkaException.Level.INFO);
        errorHandler.addNotRetryableExceptions(
                IllegalArgumentException.class
        );

        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }

    @Bean
    public ConsumerFactory<String, TicketNotificationEvent> notificationConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ticket_notification_group");

        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        
        JsonDeserializer<TicketNotificationEvent> jsonDeserializer = new JsonDeserializer<>(TicketNotificationEvent.class, objectMapper);
        jsonDeserializer.addTrustedPackages("com.example.Ticketizer.features.booking");
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                jsonDeserializer
        );
    }
}