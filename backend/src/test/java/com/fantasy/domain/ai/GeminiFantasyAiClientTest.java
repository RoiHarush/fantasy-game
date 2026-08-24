package com.fantasy.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GeminiFantasyAiClientTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private HttpServer server;
    private String baseUrl;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        baseUrl = "http://localhost:" + server.getAddress().getPort();
        server.start();
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void sendsSystemInstructionAndStructuredOutputSchema() throws Exception {
        AtomicReference<JsonNode> requestBody = new AtomicReference<>();
        AtomicReference<String> apiKey = new AtomicReference<>();
        server.createContext("/models/gemini-test:generateContent", exchange -> {
            requestBody.set(mapper.readTree(exchange.getRequestBody()));
            apiKey.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            respond(exchange, 200, """
                    {"candidates":[{"content":{"parts":[{"text":"{\\"roasts\\":{\\"8\\":\\"טקסט\\"}}"}]}}]}
                    """);
        });
        GeminiFantasyAiClient client = client("gemini-test");
        JsonNode schema = mapper.readTree("""
                {"type":"object","properties":{"roasts":{"type":"object"}},"required":["roasts"],"additionalProperties":false}
                """);

        Optional<String> result = client.completeJson("system", "facts", 640,
                "fantasy_roasts", schema);

        assertEquals("{\"roasts\":{\"8\":\"טקסט\"}}", result.orElseThrow());
        assertEquals("test-key", apiKey.get());
        assertEquals("system", requestBody.get().path("systemInstruction").path("parts").path(0).path("text").asText());
        assertEquals("user", requestBody.get().path("contents").path(0).path("role").asText());
        assertEquals("facts", requestBody.get().path("contents").path(0).path("parts").path(0).path("text").asText());
        assertEquals(640, requestBody.get().path("generationConfig").path("maxOutputTokens").asInt());
        assertEquals("application/json", requestBody.get().path("generationConfig").path("responseMimeType").asText());
        assertEquals(schema, requestBody.get().path("generationConfig").path("responseJsonSchema"));
    }

    @Test
    void plainCompletionDoesNotRequestJsonModeAndSkipsThoughtParts() throws Exception {
        AtomicReference<JsonNode> requestBody = new AtomicReference<>();
        server.createContext("/models/gemini-test:generateContent", exchange -> {
            requestBody.set(mapper.readTree(exchange.getRequestBody()));
            respond(exchange, 200, """
                    {"candidates":[{"content":{"parts":[
                      {"thought":true,"text":"hidden reasoning"},
                      {"text":"תשובה טבעית"}
                    ]}}]}
                    """);
        });

        Optional<String> result = client("gemini-test").complete("system", "question", 300);

        assertEquals("תשובה טבעית", result.orElseThrow());
        assertFalse(requestBody.get().path("generationConfig").has("responseMimeType"));
        assertFalse(requestBody.get().path("generationConfig").has("responseJsonSchema"));
    }

    @Test
    void rateLimitFallsBackWithoutRetrying() {
        AtomicInteger calls = new AtomicInteger();
        server.createContext("/models/gemini-test:generateContent", exchange -> {
            calls.incrementAndGet();
            respond(exchange, 429, "{\"error\":{\"status\":\"RESOURCE_EXHAUSTED\",\"message\":\"rate limited\"}}");
        });

        Optional<String> result = client("gemini-test").complete("system", "question", 300);

        assertTrue(result.isEmpty());
        assertEquals(1, calls.get());
    }

    @Test
    void disabledClientDoesNotCallProvider() {
        AtomicInteger calls = new AtomicInteger();
        server.createContext("/models/gemini-test:generateContent", exchange -> {
            calls.incrementAndGet();
            respond(exchange, 200, "{}");
        });
        GeminiFantasyAiClient client = new GeminiFantasyAiClient(
                mapper, false, "test-key", "gemini-test", baseUrl + "/models/");

        assertTrue(client.complete("system", "question", 100).isEmpty());
        assertEquals(0, calls.get());
    }

    private GeminiFantasyAiClient client(String model) {
        return new GeminiFantasyAiClient(mapper, true, "test-key", model, baseUrl + "/models/");
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
