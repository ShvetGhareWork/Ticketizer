package com.example.Ticketizer.features.auth;

import com.example.Ticketizer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Email and password are required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials. User does not exist."));
        }

        User user = userOpt.get();
        // Standard plain-text password match for development tier database convergence
        if (!password.equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials. Password verification failed."));
        }

        String token = tokenProvider.createToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of("accessToken", token, "tokenType", "Bearer"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registerRequest) {
        String fullName = registerRequest.get("fullName");
        String email = registerRequest.get("email");
        String password = registerRequest.get("password");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email cannot be empty."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with this email already exists."));
        }

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(password)
                .provider("LOCAL")
                .build();

        userRepository.save(user);

        String token = tokenProvider.createToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of("accessToken", token, "tokenType", "Bearer"));
    }
}