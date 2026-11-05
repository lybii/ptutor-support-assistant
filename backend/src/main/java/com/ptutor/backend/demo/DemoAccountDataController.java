package com.ptutor.backend.demo;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ptutor.backend.exception.ApiException;
import com.ptutor.backend.response.ApiResponse;
import com.ptutor.backend.response.ApiResponseFactory;
import com.ptutor.backend.security.CurrentUserProvider;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;

/**
 * API chỉ-đọc "của tôi" (hợp đồng, ví, buổi học, hoàn tiền...) mà công cụ tra cứu của trợ lý gọi, trả dữ liệu
 * tài khoản demo. Thông báo và yêu cầu hỗ trợ có controller riêng, dữ liệu thật trong PostgreSQL (đường dẫn cụ
 * thể được ưu tiên hơn mẫu {@code /**} ở đây).
 */
@RestController
@RequiredArgsConstructor
public class DemoAccountDataController {

    private final DemoAccountData demoAccountData;
    private final CurrentUserProvider currentUserProvider;
    private final ApiResponseFactory responseFactory;

    @GetMapping({"/api/v1/users/me/**", "/api/v1/students/me", "/api/v1/students/me/**", "/api/v1/tutors/me",
            "/api/v1/tutors/me/**"})
    public ResponseEntity<ApiResponse<JsonNode>> read(HttpServletRequest request,
                                                      @RequestParam Map<String, String> query) {
        String path = request.getRequestURI();
        DemoAccountData.Result result = demoAccountData.find(currentUserProvider.getCurrentUserRole(), path, query);
        if (result.status() >= 400) {
            throw new ApiException(HttpStatus.valueOf(result.status()), result.code(), "Resource not found");
        }
        return ResponseEntity.ok(responseFactory.success(result.body(), path));
    }
}
