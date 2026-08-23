package com.fantasy.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Optional;

/** Provider-neutral completion boundary shared by today's roast and a future assistant. */
public interface FantasyAiClient {
    Optional<String> complete(String systemPrompt, String userPrompt, int maxTokens);

    /**
     * Requests a provider-enforced JSON response. Providers that cannot enforce the
     * supplied schema deliberately decline so callers can use their local fallback.
     */
    default Optional<String> completeJson(String systemPrompt, String userPrompt, int maxTokens,
                                          String schemaName, JsonNode schema) {
        return Optional.empty();
    }

    String providerName();
    default String modelName() { return "unknown"; }
}

