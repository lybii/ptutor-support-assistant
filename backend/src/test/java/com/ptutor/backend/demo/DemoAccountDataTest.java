package com.ptutor.backend.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ptutor.backend.dto.enums.UserRole;

import tools.jackson.databind.json.JsonMapper;

class DemoAccountDataTest {

    private static final String CONTRACT_ID = "c0000000-0000-4000-8000-000000000001";

    private final DemoAccountData data = new DemoAccountData(JsonMapper.builder().build());

    @Test
    void returnsListForTemplatePath() {
        DemoAccountData.Result result = data.find(UserRole.STUDENT, "/api/v1/users/me/contracts", Map.of());
        assertThat(result.status()).isEqualTo(200);
        assertThat(result.body().path("content").size()).isEqualTo(2);
    }

    @Test
    void choosesVariantByPathVariable() {
        DemoAccountData.Result found = data.find(UserRole.STUDENT, "/api/v1/users/me/contracts/" + CONTRACT_ID,
                Map.of());
        assertThat(found.status()).isEqualTo(200);
        assertThat(found.body().path("id").asString()).isEqualTo(CONTRACT_ID);

        DemoAccountData.Result missing = data.find(UserRole.STUDENT, "/api/v1/users/me/contracts/unknown", Map.of());
        assertThat(missing.status()).isEqualTo(404);
        assertThat(missing.code()).isEqualTo("CONTRACT_NOT_FOUND");
    }

    @Test
    void fallsBackToItemInParentList() {
        DemoAccountData.Result result = data.find(UserRole.TUTOR, "/api/v1/users/me/contracts/" + CONTRACT_ID,
                Map.of());
        assertThat(result.status()).isEqualTo(200);
        assertThat(result.body().path("id").asString()).isEqualTo(CONTRACT_ID);
    }

    @Test
    void keepsRolesSeparate() {
        assertThat(data.find(UserRole.TUTOR, "/api/v1/students/me", Map.of()).status()).isEqualTo(404);
        assertThat(data.find(UserRole.STUDENT, "/api/v1/students/me", Map.of()).status()).isEqualTo(200);
    }
}
