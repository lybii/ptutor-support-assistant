package com.ptutor.backend.demo;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Tạo tài khoản demo khi {@code DEMO_USER_PASSWORD} được đặt và bảng users còn trống.
 *
 * <p>Id của học viên, gia sư trùng với id trong dữ liệu demo ({@code demo-data/*.json}) để hợp đồng, buổi học trả về
 * đúng là của người đang đăng nhập.
 */
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    public static final UUID STUDENT_ID = UUID.fromString("a0000000-0000-4000-8000-0000000000aa");
    public static final UUID TUTOR_ID = UUID.fromString("b0000000-0000-4000-8000-0000000000bb");
    public static final UUID SUPPORT_ID = UUID.fromString("c1000000-0000-4000-8000-0000000000cc");
    public static final UUID ADMIN_ID = UUID.fromString("d1000000-0000-4000-8000-0000000000dd");

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private record DemoUser(UUID id, String email, String firstName, String lastName, String role,
                            String jobFunction, boolean employee) {
    }

    private record DemoNotification(UUID userId, String title, String content, String type, String eventType,
                                    int hoursAgo, boolean read) {
    }

    private static final List<DemoUser> USERS = List.of(
            new DemoUser(STUDENT_ID, "hocvien@ptutor.demo", "Lan", "Nguyễn", "STUDENT", null, false),
            new DemoUser(TUTOR_ID, "giasu@ptutor.demo", "An", "Trần", "TUTOR", null, false),
            new DemoUser(SUPPORT_ID, "hotro@ptutor.demo", "Minh", "Phạm", "EMPLOYEE", "CUSTOMER_SERVICE", true),
            new DemoUser(ADMIN_ID, "admin@ptutor.demo", "Quang", "Đỗ", "ADMIN", null, true));

    private static final List<DemoNotification> NOTIFICATIONS = List.of(
            new DemoNotification(STUDENT_ID, "Kỳ học phí sắp đến hạn",
                    "Kỳ 2 của hợp đồng Toán lớp 9 đến hạn thanh toán trong 3 ngày.", "PAYMENT",
                    "PAYMENT_INSTALLMENT_DUE", 6, false),
            new DemoNotification(STUDENT_ID, "Khiếu nại cần bổ sung bằng chứng",
                    "Vui lòng bổ sung bằng chứng cho khiếu nại của bạn.", "COMPLAINT",
                    "COMPLAINT_EVIDENCE_REQUESTED", 30, false),
            new DemoNotification(STUDENT_ID, "Hợp đồng đã được kích hoạt",
                    "Hợp đồng Toán lớp 9 với gia sư Trần An đã bắt đầu.", "CONTRACT", "CONTRACT_ACTIVATED", 72, true),
            new DemoNotification(TUTOR_ID, "Học viên mới ứng tuyển",
                    "Có học viên vừa ứng tuyển vào tin dạy Toán lớp 9 của bạn.", "REQUEST",
                    "STUDENT_REQUEST_RECEIVED", 5, false),
            new DemoNotification(TUTOR_ID, "Đã nhận học phí",
                    "Ví của bạn vừa được cộng học phí buổi học ngày hôm qua.", "WALLET", "WALLET_CREDITED", 20, true));

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.user-password:}")
    private String demoPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (demoPassword == null || demoPassword.isBlank()) {
            return;
        }
        Integer existing = jdbcTemplate.queryForObject("select count(*) from users", Integer.class);
        if (existing != null && existing > 0) {
            return;
        }
        Timestamp now = Timestamp.valueOf(LocalDateTime.now());
        String hash = passwordEncoder.encode(demoPassword);
        for (DemoUser user : USERS) {
            jdbcTemplate.update("""
                    insert into users (id, email, password, first_name, last_name, role, created_at, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?)""",
                    user.id(), user.email(), hash, user.firstName(), user.lastName(), user.role(), now, now);
            if (user.employee()) {
                jdbcTemplate.update("""
                        insert into employees (id, user_id, job_function, active, created_at, updated_at)
                        values (?, ?, ?, true, ?, ?)""", UUID.randomUUID(), user.id(), user.jobFunction(), now, now);
            }
        }
        for (DemoNotification notification : NOTIFICATIONS) {
            Timestamp createdAt = Timestamp.valueOf(LocalDateTime.now().minusHours(notification.hoursAgo()));
            jdbcTemplate.update("""
                    insert into notifications (id, user_id, title, content, type, event_type, is_read, created_at,
                                               updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    UUID.randomUUID(), notification.userId(), notification.title(), notification.content(),
                    notification.type(), notification.eventType(), notification.read(), createdAt, createdAt);
        }
        log.info("Đã tạo {} tài khoản demo", USERS.size());
    }
}
