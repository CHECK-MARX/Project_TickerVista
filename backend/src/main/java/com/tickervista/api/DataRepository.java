package com.tickervista.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@Component
public class DataRepository {

    private final ObjectMapper objectMapper;
    private final Path dataRoot;

    public DataRepository(ObjectMapper objectMapper, @Value("${tickervista.data-root:data}") String dataRoot) {
        this.objectMapper = objectMapper;
        this.dataRoot = Path.of(dataRoot).toAbsolutePath().normalize();
    }

    public Optional<JsonNode> readJson(String... segments) throws IOException {
        Path path = resolvePath(segments);
        if (!Files.exists(path)) {
            return Optional.empty();
        }
        if (!Files.isRegularFile(path)) {
            return Optional.empty();
        }
        try (var inputStream = Files.newInputStream(path)) {
            return Optional.of(objectMapper.readTree(inputStream));
        }
    }

    private Path resolvePath(String... segments) throws IOException {
        Path current = dataRoot;
        for (String segment : segments) {
            if (segment == null) {
                throw new IOException("Path segment must not be null");
            }
            String trimmed = segment.trim();
            if (trimmed.isEmpty()) {
                throw new IOException("Path segment must not be empty");
            }
            Path relative = Path.of(trimmed);
            if (relative.isAbsolute()) {
                throw new IOException("Absolute path segments are not allowed");
            }
            for (Path name : relative) {
                String element = name.toString();
                if ("..".equals(element) || ".".equals(element)) {
                    throw new IOException("Relative path segments are not allowed");
                }
            }
            current = current.resolve(relative);
        }
        Path normalized = current.normalize();
        if (!normalized.startsWith(dataRoot)) {
            throw new IOException("Attempt to access path outside the data root");
        }
        return normalized;
    }
}
