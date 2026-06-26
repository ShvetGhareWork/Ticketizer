package com.example.Ticketizer.features.notification;

import com.example.Ticketizer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final JwtTokenProvider tokenProvider;

    private Long getUserIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid authorization header.");
        }
        String token = authHeader.substring(7);
        return tokenProvider.getUserIdFromToken(token);
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = getUserIdFromHeader(authHeader);
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to fetch notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = getUserIdFromHeader(authHeader);
            Notification notification = notificationRepository.findById(id).orElse(null);
            if (notification == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Notification not found"));
            }
            if (!notification.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized access"));
            }
            notification.setRead(true);
            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to mark notification as read: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = getUserIdFromHeader(authHeader);
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            for (Notification notification : notifications) {
                if (!notification.isRead()) {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                }
            }
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to mark all notifications as read: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = getUserIdFromHeader(authHeader);
            Notification notification = notificationRepository.findById(id).orElse(null);
            if (notification == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Notification not found"));
            }
            if (!notification.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized access"));
            }
            notificationRepository.delete(notification);
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to delete notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @DeleteMapping("/clear-all")
    @Transactional
    public ResponseEntity<?> clearAll(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = getUserIdFromHeader(authHeader);
            notificationRepository.deleteByUserId(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications cleared"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to clear notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }
}
