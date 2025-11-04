package com.tickervista.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Locale;
import java.util.regex.Pattern;

@RestController
@RequestMapping(path = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
public class MarketController {

    private static final Pattern SYMBOL_PATTERN = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._^\\-]{0,31}$");

    private final DataRepository repository;
    private final ObjectMapper objectMapper;

    public MarketController(DataRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/markets/overview")
    public ResponseEntity<JsonNode> marketOverview() throws IOException {
        return repository.readJson("markets", "overview.json")
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    @GetMapping("/sectors/overview")
    public ResponseEntity<JsonNode> sectorsOverview() throws IOException {
        return repository.readJson("sectors", "overview.json")
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    @GetMapping("/rankings/top-movers")
    public ResponseEntity<JsonNode> topMovers() throws IOException {
        return repository.readJson("rankings", "top_movers.json")
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    @GetMapping("/rankings/dividends")
    public ResponseEntity<JsonNode> dividends() throws IOException {
        return repository.readJson("rankings", "dividends.json")
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    @GetMapping("/dictionary")
    public ResponseEntity<JsonNode> dictionary() throws IOException {
        return repository.readJson("dictionary.json")
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    @GetMapping("/symbols")
    public ResponseEntity<JsonNode> symbols(@RequestParam(required = false) String query,
                                            @RequestParam(required = false) String exchange,
                                            @RequestParam(required = false, defaultValue = "20") Integer limit) throws IOException {
        return repository.readJson("symbols", "index.json")
                .map(node -> filterSymbols(node, query, exchange, limit))
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    @GetMapping("/ohlcv")
    public ResponseEntity<JsonNode> ohlcv(@RequestParam String symbol) throws IOException {
        return loadSymbolResource(symbol, "ohlcv.json");
    }

    @GetMapping("/indicators")
    public ResponseEntity<JsonNode> indicators(@RequestParam String symbol) throws IOException {
        return loadSymbolResource(symbol, "indicators.json");
    }

    @GetMapping("/forecast")
    public ResponseEntity<JsonNode> forecast(@RequestParam String symbol) throws IOException {
        return loadSymbolResource(symbol, "forecast.json");
    }

    @GetMapping("/insights/summary")
    public ResponseEntity<JsonNode> insights(@RequestParam String symbol) throws IOException {
        return loadSymbolResource(symbol, "insights.json");
    }

    private ResponseEntity<JsonNode> loadSymbolResource(String symbol, String fileName) throws IOException {
        String normalizedSymbol = normalizeSymbol(symbol);
        if (normalizedSymbol == null) {
            return badRequest();
        }
        return repository.readJson("symbols", normalizedSymbol, fileName)
                .map(ResponseEntity::ok)
                .orElseGet(MarketController::notFound);
    }

    private JsonNode filterSymbols(JsonNode node, String query, String exchange, Integer limit) {
        if (!node.isArray()) {
            return node;
        }
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedExchange = exchange == null ? "" : exchange.trim().toLowerCase(Locale.ROOT);

        ArrayNode result = objectMapper.createArrayNode();
        for (JsonNode item : node) {
            boolean matches = true;
            if (!normalizedQuery.isEmpty()) {
                String symbol = item.path("symbol").asText("").toLowerCase(Locale.ROOT);
                String name = item.path("name").asText("").toLowerCase(Locale.ROOT);
                matches = symbol.contains(normalizedQuery) || name.contains(normalizedQuery);
            }
            if (matches && !normalizedExchange.isEmpty()) {
                String exch = item.path("exchange").asText("").toLowerCase(Locale.ROOT);
                matches = exch.contains(normalizedExchange);
            }
            if (matches) {
                result.add(item);
            }
        }
        if (limit != null && limit > 0 && result.size() > limit) {
            ArrayNode limited = objectMapper.createArrayNode();
            for (int i = 0; i < limit; i += 1) {
                limited.add(result.get(i));
            }
            return limited;
        }
        return result;
    }

    private String normalizeSymbol(String symbol) {
        if (symbol == null) {
            return null;
        }
        String trimmed = symbol.trim();
        if (!SYMBOL_PATTERN.matcher(trimmed).matches()) {
            return null;
        }
        return trimmed;
    }

    private static ResponseEntity<JsonNode> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).<JsonNode>build();
    }

    private static ResponseEntity<JsonNode> badRequest() {
        return ResponseEntity.badRequest().<JsonNode>build();
    }
}
