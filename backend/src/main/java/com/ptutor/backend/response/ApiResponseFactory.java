package com.ptutor.backend.response;

import java.time.Clock;
import java.util.Map;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ApiResponseFactory {

    private final Clock clock;

    public <T> ApiResponse<T> success(T data, String path) {
        return new ApiResponse<>(true, "SUCCESS", "OK", data, Map.of(), clock.instant(), path);
    }

    public ApiResponse<Void> error(String code, String message, Map<String, String> errors, String path) {
        return new ApiResponse<>(false, code, message, null, errors, clock.instant(), path);
    }
}
