package com.example.Ticketizer.features.inventory;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"show_id", "seat_number"})
})
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
    
    @Column(name = "seat_number", nullable = false)
    private String seatNumber; // Formatted as row + number e.g., "A1"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatStatus status;
}