package com.ptutor.backend.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/** Lỗi nghiệp vụ có mã ổn định (`code`) để frontend hiển thị đúng thông báo. */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
