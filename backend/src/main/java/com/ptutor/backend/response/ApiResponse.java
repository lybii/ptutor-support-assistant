package com.ptutor.backend.response;

import java.time.Instant;
import java.util.Map;

/** Vỏ chung của mọi phản hồi JSON. */
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data,
        Map<String, String> errors,
        Instant timestamp,
        String path) {
}
