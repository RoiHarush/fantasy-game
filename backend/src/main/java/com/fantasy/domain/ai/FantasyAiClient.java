package com.fantasy.domain.ai;

import java.util.Optional;

/** Provider-neutral completion boundary shared by today's roast and a future assistant. */
public interface FantasyAiClient {
    Optional<String> complete(String systemPrompt, String userPrompt, int maxTokens);
    String providerName();
    default String modelName() { return "unknown"; }
}

