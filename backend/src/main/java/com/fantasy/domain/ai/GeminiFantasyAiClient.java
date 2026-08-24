package com.fantasy.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import java.util.regex.Pattern;

/** Gemini implementation of the provider-neutral AI boundary. */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "gemini")
public class GeminiFantasyAiClient implements FantasyAiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiFantasyAiClient.class);
    private static final String DEFAULT_MODEL = "gemini-3.5-flash";
    private static final Pattern SAFE_MODEL_NAME = Pattern.compile("[A-Za-z0-9._-]+");

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiFantasyAiClient(ObjectMapper objectMapper,
                                 @Value("${app.ai.enabled:false}") boolean enabled,
                                 @Value("${app.ai.api-key:}") String apiKey,
                                 @Value("${app.ai.model:}") String configuredModel,
                                 @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String baseUrl) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        this.enabled = enabled;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = configuredModel == null || configuredModel.isBlank()
                ? DEFAULT_MODEL : configuredModel.trim();
        this.baseUrl = stripTrailingSlash(baseUrl);
    }

    @Override
    public Optional<String> complete(String systemPrompt, String userPrompt, int maxTokens) {
        return generate(systemPrompt, userPrompt, maxTokens, null);
    }

    @Override
    public Optional<String> completeJson(String systemPrompt, String userPrompt, int maxTokens,
                                         String schemaName, JsonNode schema) {
        if (schemaName == null || schemaName.isBlank() || schema == null || schema.isMissingNode()) {
            return Optional.empty();
        }
        return generate(systemPrompt, userPrompt, maxTokens, schema);
    }

    private Optional<String> generate(String systemPrompt, String userPrompt, int maxTokens, JsonNode schema) {
        if (!enabled || apiKey.isBlank()) return Optional.empty();
        if (!SAFE_MODEL_NAME.matcher(model).matches()) {
            log.warn("Gemini model name is invalid; AI request was skipped");
            return Optional.empty();
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.putObject("systemInstruction").putArray("parts")
                    .addObject().put("text", systemPrompt);
            ObjectNode userContent = body.putArray("contents").addObject();
            userContent.put("role", "user");
            userContent.putArray("parts").addObject().put("text", userPrompt);

            ObjectNode generationConfig = body.putObject("generationConfig");
            generationConfig.put("temperature", 0.9);
            generationConfig.put("maxOutputTokens", Math.max(1, maxTokens));
            if (schema != null) {
                generationConfig.put("responseMimeType", "application/json");
                generationConfig.set("responseJsonSchema", schema);
            }

            HttpRequest request = HttpRequest.newBuilder(endpoint())
                    .timeout(Duration.ofSeconds(25))
                    .header("x-goog-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("AI provider returned HTTP {}: {}", response.statusCode(), providerError(response.body()));
                return Optional.empty();
            }

            JsonNode parts = objectMapper.readTree(response.body())
                    .path("candidates").path(0).path("content").path("parts");
            if (!parts.isArray()) return Optional.empty();
            StringBuilder content = new StringBuilder();
            for (JsonNode part : parts) {
                if (!part.path("thought").asBoolean(false) && part.path("text").isTextual()) {
                    content.append(part.path("text").asText());
                }
            }
            String result = content.toString().trim();
            return result.isBlank() ? Optional.empty() : Optional.of(result);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("AI request was interrupted");
            return Optional.empty();
        } catch (Exception exception) {
            log.warn("AI provider is unavailable: {}", safeErrorPart(exception.getMessage()));
            return Optional.empty();
        }
    }

    private URI endpoint() {
        return URI.create(baseUrl + "/" + model + ":generateContent");
    }

    @Override
    public String providerName() {
        return "gemini";
    }

    @Override
    public String modelName() {
        return model;
    }

    private String providerError(String responseBody) {
        try {
            JsonNode error = objectMapper.readTree(responseBody).path("error");
            String status = safeErrorPart(error.path("status").asText(""));
            String message = safeErrorPart(error.path("message").asText(""));
            String summary = (status.isBlank() ? "" : "status=" + status + ", ")
                    + (message.isBlank() ? "request rejected" : message);
            return summary.length() <= 400 ? summary : summary.substring(0, 400);
        } catch (Exception ignored) {
            return "request rejected (unreadable provider response)";
        }
    }

    private String safeErrorPart(String value) {
        if (value == null) return "";
        return value.replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private static String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://generativelanguage.googleapis.com/v1beta/models";
        }
        return value.trim().replaceFirst("/+$", "");
    }
}
