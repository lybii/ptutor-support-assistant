package com.ptutor.backend.config;

import static com.ptutor.backend.config.SecurityConstants.ADMIN_ASSISTANT_API;
import static com.ptutor.backend.config.SecurityConstants.ADMIN_SUPPORT_REQUEST_API;
import static com.ptutor.backend.config.SecurityConstants.API_PUBLIC;
import static com.ptutor.backend.config.SecurityConstants.ASSISTANT_API;
import static com.ptutor.backend.config.SecurityConstants.STUDENT_SELF_SERVICE_API;
import static com.ptutor.backend.config.SecurityConstants.SUPPORT_REQUEST_SELF_SERVICE_API;
import static com.ptutor.backend.config.SecurityConstants.TUTOR_SELF_SERVICE_API;
import static com.ptutor.backend.config.SecurityConstants.USER_SELF_SERVICE_API;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.ptutor.backend.response.ApiResponseFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class SecurityConfig {

    @Bean
    public SecretKey jwtSecretKey(@Value("${app.security.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey, @Value("${app.security.jwt.issuer}") String issuer) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        return decoder;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");
            return role == null || role.isBlank() ? List.of() : List.of(new SimpleGrantedAuthority("ROLE_" + role));
        });
        return converter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationConverter converter,
                                                   ApiResponseFactory responseFactory, ObjectMapper objectMapper,
                                                   CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(API_PUBLIC).permitAll()
                        .requestMatchers(ADMIN_ASSISTANT_API).hasRole("ADMIN")
                        .requestMatchers(ASSISTANT_API).hasAnyRole("STUDENT", "TUTOR")
                        .requestMatchers(SUPPORT_REQUEST_SELF_SERVICE_API).hasAnyRole("STUDENT", "TUTOR")
                        .requestMatchers(ADMIN_SUPPORT_REQUEST_API).hasAnyRole("ADMIN", "EMPLOYEE")
                        .requestMatchers(STUDENT_SELF_SERVICE_API).hasRole("STUDENT")
                        .requestMatchers(TUTOR_SELF_SERVICE_API).hasRole("TUTOR")
                        .requestMatchers(USER_SELF_SERVICE_API).authenticated()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint((request, response, exception) -> writeError(response, request,
                                HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", responseFactory, objectMapper)))
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, exception) -> writeError(response, request,
                                HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", responseFactory, objectMapper))
                        .accessDeniedHandler((request, response, exception) -> writeError(response, request,
                                HttpStatus.FORBIDDEN, "FORBIDDEN", responseFactory, objectMapper)));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.security.cors-allowed-origins}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static void writeError(HttpServletResponse response, HttpServletRequest request, HttpStatus status,
                                   String code, ApiResponseFactory responseFactory, ObjectMapper objectMapper)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(),
                responseFactory.error(code, status.getReasonPhrase(), Map.of(), request.getRequestURI()));
    }
}
