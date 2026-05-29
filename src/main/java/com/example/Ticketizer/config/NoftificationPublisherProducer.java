package com.example.Ticketizer.config;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.example.Ticketizer.features.booking.TicketNotificationEvent;

@Service
@RequiredArgsConstructor    
public class NoftificationPublisherProducer {
    
    public final KafkaTemplate<String, Object> kafkatemplate;
    public static final String TOPIC = "ticket_notifications";

    public void publishConfrimationEvent(TicketNotificationEvent event){
        kafkatemplate.send(TOPIC, event.bookingId(), event)
            .whenComplete((result, ex) -> {
                if(ex != null){
                    System.err.println("Failed to publish Notification event for" + event.bookingId());
                }
            });
    }
}
