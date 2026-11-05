package com.ptutor.backend.security;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.ptutor.backend.dto.enums.UserRole;
import com.ptutor.backend.exception.ApiException;

/** Đọc người dùng hiện tại từ access token (subject = id người dùng, claim {@code role}). */
@Component
public class CurrentUserProvider {

    public UUID getCurrentUserId() {
        try {
            return UUID.fromString(currentToken().getToken().getSubject());
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw invalidUser();
        }
    }

    public UserRole getCurrentUserRole() {
        try {
            return UserRole.valueOf(currentToken().getToken().getClaimAsString("role"));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw invalidUser();
        }
    }

    private JwtAuthenticationToken currentToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token && token.isAuthenticated()) {
            return token;
        }
        throw invalidUser();
    }

    private static ApiException invalidUser() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_AUTHENTICATED_USER",
                "Authenticated user identity is invalid");
    }
}
