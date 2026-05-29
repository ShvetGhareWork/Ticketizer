package com.example.Ticketizer.config;

import com.example.Ticketizer.features.booking.ReservationEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    private ProducerFactory<String, ?> createProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 5);
        configProps.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);

        // Configure a dedicated ObjectMapper capable of handling Java 8 Date/Time variants
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // Format as ISO-8601 strings

        return new DefaultKafkaProducerFactory<>(
                configProps,
                new StringSerializer(),
                new JsonSerializer<>(objectMapper) // Pass the configured mapper instance
        );
    }

    @Bean
    @SuppressWarnings("unchecked")
    public ProducerFactory<String, ReservationEvent> producerFactory() {
        return (ProducerFactory<String, ReservationEvent>) createProducerFactory();
    }

    @Bean
    @SuppressWarnings("unchecked")
    public ProducerFactory<String, Object> producerFactoryObject() {
        return (ProducerFactory<String, Object>) createProducerFactory();
    }

    @Bean
    public KafkaTemplate<String, ReservationEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    @Bean
    public KafkaTemplate<String, Object> kafkatemplate() {
        return new KafkaTemplate<>(producerFactoryObject());
    }
}