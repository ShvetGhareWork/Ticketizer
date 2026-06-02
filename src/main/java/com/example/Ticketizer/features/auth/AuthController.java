package com.example.Ticketizer.features.auth;

import com.example.Ticketizer.security.JwtTokenProvider;
import com.example.Ticketizer.features.notification.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final EmailService emailService;

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
        if (!password.equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials. Password verification failed."));
        }

        // If user is local and unverified, trigger code generation
        if ("LOCAL".equals(user.getProvider()) && !user.isVerified()) {
            String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
            Instant expiry = Instant.now().plus(10, ChronoUnit.MINUTES);
            user.setOtpCode(otp);
            user.setOtpExpiry(expiry);
            userRepository.save(user);

            String activeMethod = user.getVerificationMethod() != null ? user.getVerificationMethod() : "EMAIL";
            if ("SMS".equalsIgnoreCase(activeMethod) && user.getPhoneNumber() != null && !user.getPhoneNumber().trim().isEmpty()) {
                System.out.println("=================================================");
                System.out.println("💬 SMS OTP SERVICE (SANDBOX MOCK - LOGIN TRIGGER):");
                System.out.println("SENDING OTP TO MOBILE: " + user.getPhoneNumber());
                System.out.println("OTP CODE: " + otp);
                System.out.println("=================================================");
            } else {
                try {
                    emailService.sendOtpEmail(user.getEmail(), otp);
                } catch (Exception ex) {
                    System.err.println("Failed to send OTP email: " + ex.getMessage());
                }
            }
        }

        String token = tokenProvider.createToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of(
            "accessToken", token, 
            "tokenType", "Bearer",
            "isVerified", user.isVerified(),
            "email", user.getEmail(),
            "fullName", user.getFullName() != null ? user.getFullName() : "",
            "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
            "verificationMethod", user.getVerificationMethod() != null ? user.getVerificationMethod() : "EMAIL"
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registerRequest) {
        String fullName = registerRequest.get("fullName");
        String email = registerRequest.get("email");
        String password = registerRequest.get("password");
        String phoneNumber = registerRequest.get("phoneNumber");
        String verificationMethod = registerRequest.get("verificationMethod"); // "EMAIL" or "SMS"

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email cannot be empty."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with this email already exists."));
        }

        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        Instant expiry = Instant.now().plus(10, ChronoUnit.MINUTES);

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(password)
                .provider("LOCAL")
                .phoneNumber(phoneNumber)
                .isVerified(false)
                .otpCode(otp)
                .otpExpiry(expiry)
                .verificationMethod(verificationMethod != null ? verificationMethod : "EMAIL")
                .build();

        userRepository.save(user);

        if ("SMS".equalsIgnoreCase(verificationMethod) && phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            System.out.println("=================================================");
            System.out.println("💬 SMS OTP SERVICE (SANDBOX MOCK):");
            System.out.println("SENDING OTP TO MOBILE: " + phoneNumber);
            System.out.println("OTP CODE: " + otp);
            System.out.println("=================================================");
        } else {
            try {
                emailService.sendOtpEmail(email, otp);
            } catch (Exception ex) {
                System.err.println("Failed to send verification email: " + ex.getMessage());
            }
        }

        String token = tokenProvider.createToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of(
            "accessToken", token, 
            "tokenType", "Bearer",
            "isVerified", false,
            "email", email,
            "fullName", fullName != null ? fullName : "",
            "phoneNumber", phoneNumber != null ? phoneNumber : "",
            "verificationMethod", verificationMethod != null ? verificationMethod : "EMAIL"
        ));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> googleRequest) {
        String email = googleRequest.get("email");
        String fullName = googleRequest.get("fullName");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required for Google OAuth."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isEmpty()) {
            user = User.builder()
                    .fullName(fullName != null ? fullName : "Google User")
                    .email(email)
                    .password("google-oauth-mock")
                    .provider("GOOGLE")
                    .isVerified(true) // Pre-verified by Google
                    .build();
            userRepository.save(user);
        } else {
            user = userOpt.get();
            boolean needSave = false;
            if ("LOCAL".equals(user.getProvider())) {
                user.setProvider("GOOGLE");
                needSave = true;
            }
            if (!user.isVerified()) {
                user.setVerified(true);
                needSave = true;
            }
            if (needSave) {
                userRepository.save(user);
            }
        }

        String token = tokenProvider.createToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of(
            "accessToken", token, 
            "tokenType", "Bearer",
            "isVerified", true,
            "email", user.getEmail(),
            "fullName", user.getFullName() != null ? user.getFullName() : ""
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> verifyRequest) {
        String email = verifyRequest.get("email");
        String otp = verifyRequest.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }

        User user = userOpt.get();
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(Instant.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of("error", "OTP has expired. Please request a new one."));
        }

        if (!otp.trim().equals(user.getOtpCode())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Incorrect OTP. Verification failed."));
        }

        user.setVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "OTP verified successfully. Account unlocked!", "isVerified", true));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> resendRequest) {
        String email = resendRequest.get("email");
        String method = resendRequest.get("verificationMethod"); // Optional override

        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }

        User user = userOpt.get();
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        Instant expiry = Instant.now().plus(10, ChronoUnit.MINUTES);

        if (method != null) {
            user.setVerificationMethod(method);
        }
        user.setOtpCode(otp);
        user.setOtpExpiry(expiry);
        userRepository.save(user);

        String activeMethod = user.getVerificationMethod() != null ? user.getVerificationMethod() : "EMAIL";

        if ("SMS".equalsIgnoreCase(activeMethod) && user.getPhoneNumber() != null && !user.getPhoneNumber().trim().isEmpty()) {
            System.out.println("=================================================");
            System.out.println("💬 SMS OTP SERVICE (SANDBOX MOCK - RESEND):");
            System.out.println("SENDING OTP TO MOBILE: " + user.getPhoneNumber());
            System.out.println("OTP CODE: " + otp);
            System.out.println("=================================================");
        } else {
            try {
                emailService.sendOtpEmail(user.getEmail(), otp);
            } catch (Exception ex) {
                System.err.println("Failed to send resend email: " + ex.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of("message", "OTP code resent successfully."));
    }
}