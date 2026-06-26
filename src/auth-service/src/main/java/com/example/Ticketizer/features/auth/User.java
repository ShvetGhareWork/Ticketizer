package com.example.Ticketizer.features.auth;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Builder.Default
    @Column(nullable = false)
    private String provider = "LOCAL";

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expiry")
    private java.time.Instant otpExpiry;

    @Column(name = "verification_method")
    private String verificationMethod; // "EMAIL" or "SMS"
}
