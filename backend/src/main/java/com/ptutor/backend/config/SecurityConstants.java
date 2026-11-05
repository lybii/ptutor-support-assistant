package com.ptutor.backend.config;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class SecurityConstants {

    public static final String[] API_PUBLIC = {
            "/api/v1/auth/login",
            "/api/v1/health"
    };

    /** Widget trợ lý của học viên, gia sư (docs/07-api.md mục 7.1). */
    public static final String[] ASSISTANT_API = {
            "/api/v1/assistant",
            "/api/v1/assistant/**"
    };

    /** Quản trị kho tri thức của trợ lý: chỉ ADMIN. */
    public static final String[] ADMIN_ASSISTANT_API = {
            "/api/v1/admin/assistant",
            "/api/v1/admin/assistant/**"
    };

    /** Yêu cầu hỗ trợ gửi nhân viên (docs/14-yeu-cau-ho-tro.md mục 14.5): học viên, gia sư. */
    public static final String[] SUPPORT_REQUEST_SELF_SERVICE_API = {
            "/api/v1/users/me/support-requests",
            "/api/v1/users/me/support-requests/**"
    };

    /** Hàng chờ yêu cầu hỗ trợ: ADMIN và EMPLOYEE (service kiểm thêm chức năng CUSTOMER_SERVICE). */
    public static final String[] ADMIN_SUPPORT_REQUEST_API = {
            "/api/v1/admin/support-requests",
            "/api/v1/admin/support-requests/**"
    };

    /** Dữ liệu "của tôi" mà công cụ tra cứu của trợ lý đọc (tool-catalog/tools.yaml). */
    public static final String[] USER_SELF_SERVICE_API = {
            "/api/v1/users/me/**"
    };

    public static final String[] STUDENT_SELF_SERVICE_API = {
            "/api/v1/students/me",
            "/api/v1/students/me/**"
    };

    public static final String[] TUTOR_SELF_SERVICE_API = {
            "/api/v1/tutors/me",
            "/api/v1/tutors/me/**"
    };
}
