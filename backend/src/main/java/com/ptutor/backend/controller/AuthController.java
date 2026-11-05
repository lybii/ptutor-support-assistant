package com.ptutor.backend.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ptutor.backend.entity.User;
import com.ptutor.backend.exception.ApiException;
import com.ptutor.backend.repository.UserRepository;
import com.ptutor.backend.response.ApiResponse;
import com.ptutor.backend.response.ApiResponseFactory;
import com.ptutor.backend.security.CurrentUserProvider;
import com.ptutor.backend.security.JwtTokenService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService tokenService;
    private final CurrentUserProvider currentUserProvider;
    private final ApiResponseFactory responseFactory;

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record CurrentUserResponse(UUID userId, String email, String firstName, String lastName, String role) {

        static CurrentUserResponse from(User user) {
            return new CurrentUserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                    user.getRole().name());
        }
    }

    public record LoginResponse(String accessToken, String tokenType, long expiresIn, CurrentUserResponse user) {
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.email().strip())
                .filter(found -> passwordEncoder.matches(request.password(), found.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                        "Email or password is incorrect"));
        LoginResponse body = new LoginResponse(tokenService.issueAccessToken(user), "Bearer",
                tokenService.ttlSeconds(), CurrentUserResponse.from(user));
        return ResponseEntity.ok(responseFactory.success(body, "/api/v1/auth/login"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> me() {
        User user = userRepository.findById(currentUserProvider.getCurrentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_AUTHENTICATED_USER",
                        "Authenticated user no longer exists"));
        return ResponseEntity.ok(responseFactory.success(CurrentUserResponse.from(user), "/api/v1/auth/me"));
    }
}
