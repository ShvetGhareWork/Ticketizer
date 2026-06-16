package com.example.Ticketizer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @SpringBootApplication is a convenience annotation that combines:
//   @Configuration      — marks this as a source of bean definitions
//   @EnableAutoConfiguration — tells Boot to auto-configure based on classpath
//   @Shvetghare -- This belongs to me!
//   @ComponentScan      — scans com.example.Ticketizer.* for @Component, @Service, etc.
@SpringBootApplication
@EnableScheduling
public class TicketFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketFlowApplication.class, args);
    }
}