package com.example.Ticketizer.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "seats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @Column(name = "seat_number", nullable = false, length = 20)
    private String seatNumber;  // e.g. "A12"

    @Column(name = "row_identifier", nullable = false, length = 10)
    private String rowIdentifier;  // e.g. "A", "B", "VIP"

    // BigDecimal for money — NEVER use float or double for currency.
    // Float arithmetic: 0.1 + 0.2 = 0.30000000000000004
    // BigDecimal is exact. The DB stores it as NUMERIC(10,2).
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // @Enumerated(EnumType.STRING): Hibernate stores the enum name ("AVAILABLE")
    // as a string, NOT the ordinal (0, 1, 2).
    // NEVER use EnumType.ORDINAL — if you reorder the enum values, all your
    // existing data silently maps to wrong values.
    // columnDefinition = "seat_status": tells Hibernate to use the PostgreSQL
    // ENUM type directly (not VARCHAR). The JDBC driver does the string→enum cast.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "seat_status")
    @Builder.Default
    private SeatStatus status = SeatStatus.AVAILABLE;
}
