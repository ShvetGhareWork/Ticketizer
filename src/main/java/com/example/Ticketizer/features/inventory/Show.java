package com.example.Ticketizer.features.inventory;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import com.example.Ticketizer.features.booking.Booking;

@Entity
@Table(name = "shows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Show {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // @ManyToOne with LAZY fetch: when you load a Show, Hibernate does NOT
    // immediately load the parent Event. It creates a proxy. Only when you
    // call show.getEvent().getName() does it fire a SELECT for the event.
    // This is correct for our use case — we rarely need event data when
    // processing a booking.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String venue;

    // OffsetDateTime includes timezone offset. TIMESTAMPTZ in Postgres stores
    // UTC and returns with offset. Always prefer OffsetDateTime over LocalDateTime
    // for anything event-time — LocalDateTime has no timezone and causes bugs
    // when your server or client is in a different timezone.
    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private OffsetDateTime endTime;

    @Column(name = "total_capacity", nullable = false)
    private Integer totalCapacity;

    @OneToMany(mappedBy = "show", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Seat> seats = new ArrayList<>();

    @OneToMany(mappedBy = "show", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    @Column(nullable = false)
    private Double price;

    private String hallName;
}