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

import static org.junit.jupiter.api.Assertions.*;

class GroqFantasyAiClientTest {
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
    void sendsStrictSchemaAndDoesNotAskProviderToStoreThePrompt() throws Exception {
        AtomicReference<JsonNode> requestBody = new AtomicReference<>();
        server.createContext("/chat", exchange -> {
            requestBody.set(mapper.readTree(exchange.getRequestBody()));
            respond(exchange, 200, """
                    {"choices":[{"message":{"content":"{\\"roasts\\":[]}"}}]}
                    """);
        });
        GroqFantasyAiClient client = client(baseUrl + "/chat");
        JsonNode schema = mapper.readTree("""
                {"type":"object","properties":{"roasts":{"type":"array"}},"required":["roasts"],"additionalProperties":false}
                """);

        Optional<String> result = client.completeJson("system", "facts", 400, "fantasy_roasts", schema);

        assertEquals("{\"roasts\":[]}", result.orElseThrow());
        assertFalse(requestBody.get().path("store").asBoolean(true));
        assertEquals("json_schema", requestBody.get().path("response_format").path("type").asText());
        assertTrue(requestBody.get().path("response_format").path("json_schema").path("strict").asBoolean());
        assertEquals(schema, requestBody.get().path("response_format").path("json_schema").path("schema"));
    }

    @Test
    void rateLimitFallsBackWithoutRetrying() {
        AtomicInteger calls = new AtomicInteger();
        server.createContext("/rate-limited", exchange -> {
            calls.incrementAndGet();
            respond(exchange, 429, "{\"error\":{\"message\":\"rate limited\"}}");
        });
        GroqFantasyAiClient client = client(baseUrl + "/rate-limited");

        Optional<String> result = client.completeJson("system", "facts", 400,
                "fantasy_roasts", mapper.createObjectNode().put("type", "object"));

        assertTrue(result.isEmpty());
        assertEquals(1, calls.get());
    }

    private GroqFantasyAiClient client(String url) {
        return new GroqFantasyAiClient(mapper, true, "groq", "test-key",
                "openai/gpt-oss-20b", url);
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
