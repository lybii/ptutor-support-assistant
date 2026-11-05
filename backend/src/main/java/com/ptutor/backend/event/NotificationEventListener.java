package com.ptutor.backend.event;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.ptutor.backend.entity.Notification;
import com.ptutor.backend.repository.NotificationRepository;
import com.ptutor.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** Lưu thông báo trong cùng giao dịch với thay đổi nghiệp vụ đã phát ra sự kiện. */
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @EventListener
    public void on(NotificationDomainEvent event) {
        String code = event.data().getOrDefault("code", "");
        Notification notification = new Notification();
        notification.setUser(userRepository.getReferenceById(event.recipientUserId()));
        notification.setType("SUPPORT");
        notification.setEventType(event.eventType().name());
        notification.setReferenceType(event.referenceType() == null ? null : event.referenceType().name());
        notification.setReferenceId(event.referenceId());
        switch (event.eventType()) {
            case SUPPORT_REQUEST_RECEIVED -> {
                notification.setTitle("Yêu cầu hỗ trợ mới");
                notification.setContent("Yêu cầu " + code + " đang chờ nhân viên tiếp nhận.");
            }
            case SUPPORT_REQUEST_ANSWERED -> {
                notification.setTitle("Yêu cầu hỗ trợ đã được trả lời");
                notification.setContent("Yêu cầu " + code + " đã có câu trả lời từ nhân viên hỗ trợ.");
            }
        }
        notificationRepository.save(notification);
    }
}
