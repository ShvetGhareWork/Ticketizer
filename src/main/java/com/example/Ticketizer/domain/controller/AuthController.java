package com.example.Ticketizer.domain.controller;

import com.example.Ticketizer.domain.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final com.example.Ticketizer.domain.security.JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Password verification failed. Password cannot be empty."));
        }

        Long mockUserId = 810L; 

        String token = tokenProvider.createToken(mockUserId, email);
        return ResponseEntity.ok(Map.of("accessToken", token, "tokenType", "Bearer"));
    }
}