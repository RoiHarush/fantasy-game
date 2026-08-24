package com.fantasy.domain.ai;

import java.time.LocalDateTime;
import java.util.List;

public record AiRoastDto(
        int gameweek,
        long serverTimeEpochMs,
        long rotationAnchorEpochMs,
        int rotationSeconds,
        String provider,
        String model,
        List<Item> roasts
) {
    public record Item(int targetUserId, String targetDisplayName, String fantasyTeamName,
                       String content, boolean generatedByAi, LocalDateTime generatedAt,
                       int rotationIndex) {}
}

