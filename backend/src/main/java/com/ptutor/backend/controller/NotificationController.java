package com.ptutor.backend.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ptutor.backend.dto.response.PageResponse;
import com.ptutor.backend.entity.Notification;
import com.ptutor.backend.exception.ApiException;
import com.ptutor.backend.repository.NotificationRepository;
import com.ptutor.backend.response.ApiResponse;
import com.ptutor.backend.response.ApiResponseFactory;
import com.ptutor.backend.security.CurrentUserProvider;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(NotificationController.BASE_PATH)
@RequiredArgsConstructor
public class NotificationController {

    static final String BASE_PATH = "/api/v1/users/me/notifications";

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ApiResponseFactory responseFactory;

    public record NotificationResponse(UUID id, String title, String content, String type, String eventType,
                                       String referenceType, String referenceId, boolean isRead,
                                       LocalDateTime createdAt) {

        static NotificationResponse from(Notification notification) {
            return new NotificationResponse(notification.getId(), notification.getTitle(), notification.getContent(),
                    notification.getType(), notification.getEventType(), notification.getReferenceType(),
                    notification.getReferenceId(), notification.isRead(), notification.getCreatedAt());
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean isRead) {
        UUID userId = currentUserProvider.getCurrentUserId();
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50));
        Page<Notification> result = isRead == null
                ? notificationRepository.findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUser_IdAndReadAndDeletedAtIsNullOrderByCreatedAtDesc(userId, isRead,
                        pageable);
        PageResponse<NotificationResponse> body = PageResponse.from(result,
                result.getContent().stream().map(NotificationResponse::from).toList());
        return ResponseEntity.ok(responseFactory.success(body, BASE_PATH));
    }

    @GetMapping("/unread-count")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount() {
        long count = notificationRepository.countByUser_IdAndReadFalseAndDeletedAtIsNull(
                currentUserProvider.getCurrentUserId());
        return ResponseEntity.ok(responseFactory.success(Map.of("unreadCount", count), BASE_PATH + "/unread-count"));
    }

    @PatchMapping("/{notificationId}/read")
    @Transactional
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(@PathVariable UUID notificationId) {
        Notification notification = notificationRepository
                .findByIdAndUser_Id(notificationId, currentUserProvider.getCurrentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND",
                        "Notification not found"));
        notification.setRead(true);
        return ResponseEntity.ok(responseFactory.success(NotificationResponse.from(notification),
                BASE_PATH + "/" + notificationId + "/read"));
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllRead() {
        int updated = notificationRepository.markAllRead(currentUserProvider.getCurrentUserId());
        return ResponseEntity.ok(responseFactory.success(Map.of("updated", updated), BASE_PATH + "/read-all"));
    }
}
