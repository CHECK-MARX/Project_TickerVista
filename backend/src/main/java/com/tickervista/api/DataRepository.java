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
        this.dataRoot = Path.of(dataRoot).toAbsolutePath();
    }

    public Optional<JsonNode> readJson(String... segments) throws IOException {
        Path path = dataRoot;
        for (String segment : segments) {
            path = path.resolve(segment);
        }
        if (!Files.exists(path)) {
            return Optional.empty();
        }
        try (var inputStream = Files.newInputStream(path)) {
            return Optional.of(objectMapper.readTree(inputStream));
        }
    }
}
