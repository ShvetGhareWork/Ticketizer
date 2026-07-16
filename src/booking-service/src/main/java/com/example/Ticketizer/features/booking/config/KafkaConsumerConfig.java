package com.example.Ticketizer.features.booking.config;

import com.example.Ticketizer.shared.dto.ReservationEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import org.springframework.beans.factory.annotation.Value;
import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerConfig.class);

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ReservationEvent> kafkaListenerContainerFactory(
            KafkaTemplate<String, ReservationEvent> kafkaTemplate) {
        
        ConcurrentKafkaListenerContainerFactory<String, ReservationEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        
        // Spins up 3 concurrent threads to process messages in parallel, improving throughput for high-volume topics.
        factory.setConcurrency(3);

        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> {
                    log.error("Pipeline Failure: Routing event to DLQ.");
                    return new TopicPartition(record.topic() + ".DLT", record.partition());
                });

        FixedBackOff backOff = new FixedBackOff(2000L, 3);

        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);
        errorHandler.setLogLevel(org.springframework.kafka.KafkaException.Level.INFO);
        errorHandler.addNotRetryableExceptions(
                org.springframework.dao.DataIntegrityViolationException.class,
                jakarta.persistence.EntityNotFoundException.class,
                IllegalArgumentException.class
        );

        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }

    @Bean
    public ConsumerFactory<String, ReservationEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ticketizer-group");

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        JsonDeserializer<ReservationEvent> jsonDeserializer = new JsonDeserializer<>(ReservationEvent.class, objectMapper);
        jsonDeserializer.addTrustedPackages("com.example.Ticketizer.shared.dto");
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                jsonDeserializer
        );
    }
}
