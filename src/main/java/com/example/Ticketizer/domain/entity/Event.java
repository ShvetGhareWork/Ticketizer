package com.example.Ticketizer.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // GenerationType.IDENTITY → uses the BIGSERIAL sequence in Postgres.
    // Alternative: SEQUENCE (more Hibernate-idiomatic, fewer round-trips for batch inserts).
    // For our scale, IDENTITY is fine and maps 1:1 to BIGSERIAL in the migration.
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // mappedBy = "event" means: the foreign key column lives on the Show side.
    // Hibernate doesn't create a join table — it just uses show.event_id.
    // cascade = ALL: saving an Event cascades to its Shows.
    // fetch = LAZY: DON'T load all shows when you load an event. Load only when accessed.
    //   Without LAZY, every Event query would JOIN-load potentially thousands of rows.
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    // Initialize to empty list so .getShows() never returns null.
    // This is a Lombok @Builder gotcha: without @Builder.Default, the builder
    // sets the field to null even though you initialized it here.
    private List<Show> shows = new ArrayList<>();
}
