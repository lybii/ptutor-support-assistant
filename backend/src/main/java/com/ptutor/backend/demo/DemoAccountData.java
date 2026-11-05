package com.ptutor.backend.demo;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import com.ptutor.backend.dto.enums.UserRole;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Dữ liệu tài khoản demo (hợp đồng, ví, buổi học...) cho các công cụ tra cứu của trợ lý.
 *
 * <p>Đọc {@code demo-data/<ROLE>.json} (sinh bởi {@code scripts/build_demo_data.py}): mỗi khoá là đường dẫn mẫu
 * trong {@code tool-catalog/tools.yaml}, giá trị là {@code default} cùng các biến thể {@code byArgs} chọn theo tham
 * số đường dẫn hoặc query. Đường dẫn chi tiết không có dữ liệu riêng thì tìm phần tử cùng {@code id} trong danh
 * sách cha.
 */
@Component
public class DemoAccountData {

    public record Result(int status, String code, JsonNode body) {
    }

    private static final PathPatternParser PARSER = new PathPatternParser();

    private final Map<UserRole, Map<PathPattern, JsonNode>> datasets = new EnumMap<>(UserRole.class);

    public DemoAccountData(ObjectMapper objectMapper) {
        for (UserRole role : new UserRole[] {UserRole.STUDENT, UserRole.TUTOR}) {
            datasets.put(role, load(objectMapper, role));
        }
    }

    public Result find(UserRole role, String path, Map<String, String> query) {
        Map<PathPattern, JsonNode> dataset = datasets.getOrDefault(role, Map.of());
        PathContainer container = PathContainer.parsePath(path);
        for (Map.Entry<PathPattern, JsonNode> entry : dataset.entrySet()) {
            PathPattern.PathMatchInfo match = entry.getKey().matchAndExtract(container);
            if (match != null) {
                Map<String, String> arguments = new HashMap<>(query);
                arguments.putAll(match.getUriVariables());
                return choose(entry.getValue(), arguments);
            }
        }
        return findInParentList(dataset, path, query).orElse(new Result(404, "RESOURCE_NOT_FOUND", null));
    }

    private Optional<Result> findInParentList(Map<PathPattern, JsonNode> dataset, String path,
                                              Map<String, String> query) {
        int slash = path.lastIndexOf('/');
        if (slash <= 0) {
            return Optional.empty();
        }
        String id = path.substring(slash + 1);
        String parent = path.substring(0, slash);
        PathContainer container = PathContainer.parsePath(parent);
        for (Map.Entry<PathPattern, JsonNode> entry : dataset.entrySet()) {
            PathPattern.PathMatchInfo match = entry.getKey().matchAndExtract(container);
            if (match == null) {
                continue;
            }
            Map<String, String> arguments = new HashMap<>(query);
            arguments.putAll(match.getUriVariables());
            Result list = choose(entry.getValue(), arguments);
            JsonNode content = list.body() == null ? null : list.body().path("content");
            if (content != null && content.isArray()) {
                for (JsonNode item : content) {
                    if (id.equals(item.path("id").asString())) {
                        return Optional.of(new Result(200, null, item));
                    }
                }
            }
            return Optional.of(new Result(404, "RESOURCE_NOT_FOUND", null));
        }
        return Optional.empty();
    }

    private static Result choose(JsonNode fixture, Map<String, String> arguments) {
        JsonNode chosen = fixture.path("default");
        for (JsonNode variant : fixture.path("byArgs")) {
            if (matches(variant.path("match"), arguments)) {
                chosen = variant;
                break;
            }
        }
        int status = chosen.path("status").asInt(200);
        if (status >= 400) {
            return new Result(status, chosen.path("code").asString("RESOURCE_NOT_FOUND"), null);
        }
        return new Result(status, null, chosen.path("body"));
    }

    private static boolean matches(JsonNode match, Map<String, String> arguments) {
        Iterator<Map.Entry<String, JsonNode>> fields = match.properties().iterator();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            if (!field.getValue().asString().equals(arguments.get(field.getKey()))) {
                return false;
            }
        }
        return true;
    }

    private static Map<PathPattern, JsonNode> load(ObjectMapper objectMapper, UserRole role) {
        ClassPathResource resource = new ClassPathResource("demo-data/" + role.name() + ".json");
        if (!resource.exists()) {
            return Map.of();
        }
        try (InputStream input = resource.getInputStream()) {
            Map<PathPattern, JsonNode> dataset = new LinkedHashMap<>();
            objectMapper.readTree(input).properties()
                    .forEach(entry -> dataset.put(PARSER.parse(entry.getKey()), entry.getValue()));
            return dataset;
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
