package com.example.Ticketizer.features.booking;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_reference", nullable = false, unique = true)
    private String bookingReference;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "show_id", nullable = false)
    private Long showId;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "qr_code_payload", columnDefinition = "TEXT")
    private String qrCodePayload;

    @Column(name = "custom_event_title")
    private String customEventTitle;

    @Column(name = "custom_venue")
    private String customVenue;

    @Column(name = "custom_start_time")
    private String customStartTime;
}
