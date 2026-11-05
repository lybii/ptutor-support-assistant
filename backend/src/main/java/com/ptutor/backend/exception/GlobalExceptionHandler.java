package com.ptutor.backend.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.ptutor.backend.response.ApiResponse;
import com.ptutor.backend.response.ApiResponseFactory;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final ApiResponseFactory responseFactory;

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApi(ApiException exception, HttpServletRequest request) {
        return respond(exception.getStatus(), exception.getCode(), exception.getMessage(), Map.of(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception,
                                                              HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return respond(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", errors, request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, HandlerMethodValidationException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception exception, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Malformed request", Map.of(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(AccessDeniedException exception,
                                                             HttpServletRequest request) {
        return respond(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied", Map.of(), request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoResourceFoundException exception,
                                                            HttpServletRequest request) {
        return respond(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Resource not found", Map.of(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled error on {}", request.getRequestURI(), exception);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unexpected error", Map.of(), request);
    }

    private ResponseEntity<ApiResponse<Void>> respond(HttpStatus status, String code, String message,
                                                      Map<String, String> errors, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(responseFactory.error(code, message, errors, request.getRequestURI()));
    }
}
