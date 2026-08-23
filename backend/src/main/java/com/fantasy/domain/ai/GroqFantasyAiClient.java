package com.fantasy.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

@Component
public class GroqFantasyAiClient implements FantasyAiClient {

    private static final Logger log = LoggerFactory.getLogger(GroqFantasyAiClient.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GroqFantasyAiClient(ObjectMapper objectMapper,
                               @Value("${app.ai.enabled:false}") boolean enabled,
                               @Value("${app.ai.provider:groq}") String provider,
                               @Value("${app.ai.api-key:}") String apiKey,
                               @Value("${app.ai.model:openai/gpt-oss-20b}") String model,
                               @Value("${app.ai.base-url:https://api.groq.com/openai/v1/chat/completions}") String baseUrl) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        this.enabled = enabled;
        this.provider = provider;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
    }

    @Override
    public Optional<String> complete(String systemPrompt, String userPrompt, int maxTokens) {
        return complete(systemPrompt, userPrompt, maxTokens, null, null);
    }

    @Override
    public Optional<String> completeJson(String systemPrompt, String userPrompt, int maxTokens,
                                         String schemaName, JsonNode schema) {
        if (schemaName == null || schemaName.isBlank() || schema == null || schema.isMissingNode()) {
            return Optional.empty();
        }
        return complete(systemPrompt, userPrompt, maxTokens, schemaName, schema);
    }

    private Optional<String> complete(String systemPrompt, String userPrompt, int maxTokens,
                                      String schemaName, JsonNode schema) {
        if (!enabled || !"groq".equalsIgnoreCase(provider) || apiKey.isBlank()) {
            return Optional.empty();
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("temperature", 0.85);
            requestBody.put("max_completion_tokens", maxTokens);
            requestBody.put("reasoning_effort", "low");
            requestBody.put("include_reasoning", false);
            requestBody.put("store", false);
            if (schema != null) {
                ObjectNode responseFormat = requestBody.putObject("response_format");
                responseFormat.put("type", "json_schema");
                ObjectNode jsonSchema = responseFormat.putObject("json_schema");
                jsonSchema.put("name", schemaName);
                jsonSchema.put("strict", true);
                jsonSchema.set("schema", schema);
            }
            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject().put("role", "system").put("content", systemPrompt);
            messages.addObject().put("role", "user").put("content", userPrompt);

            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl))
                    .timeout(Duration.ofSeconds(12))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("AI provider returned HTTP {}: {}", response.statusCode(), providerError(response.body()));
                return Optional.empty();
            }

            JsonNode content = objectMapper.readTree(response.body())
                    .path("choices").path(0).path("message").path("content");
            if (!content.isTextual() || content.asText().isBlank()) return Optional.empty();
            return Optional.of(content.asText().trim());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("AI request was interrupted");
            return Optional.empty();
        } catch (Exception exception) {
            log.warn("AI provider is unavailable: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public String providerName() {
        return "groq";
    }

    @Override
    public String modelName() { return model; }

    private String providerError(String responseBody) {
        try {
            JsonNode error = objectMapper.readTree(responseBody).path("error");
            String type = safeErrorPart(error.path("type").asText(""));
            String code = safeErrorPart(error.path("code").asText(""));
            String message = safeErrorPart(error.path("message").asText(""));
            String summary = (type.isBlank() ? "" : "type=" + type + ", ")
                    + (code.isBlank() ? "" : "code=" + code + ", ")
                    + (message.isBlank() ? "request rejected" : message);
            return summary.length() <= 400 ? summary : summary.substring(0, 400);
        } catch (Exception ignored) {
            return "request rejected (unreadable provider response)";
        }
    }

    private String safeErrorPart(String value) {
        return value.replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }
}

