package com.example.Ticketizer;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// @SpringBootTest loads the full application context.
// This test passes if the app starts cleanly:
//   - Flyway migration ran without errors
//   - All Spring beans wired correctly
//   - DB connection available
//   - Kafka/Redis configured (even if not connected in test)
//
// To run without needing live infra, add application-test.yml with
// an embedded H2 datasource later. For now, run with Docker Compose up.
@SpringBootTest
class TicketFlowApplicationTests {

    @Test
    void contextLoads() {
        // If this passes, your entire Spring context assembled without errors.
        // It's a smoke test, but it catches a surprising number of config bugs.
    }
}
