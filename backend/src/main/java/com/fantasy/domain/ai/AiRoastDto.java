package com.fantasy.domain.ai;

import java.time.LocalDateTime;

public record AiRoastDto(
        int gameweek,
        String content,
        boolean generatedByAi,
        LocalDateTime generatedAt
) {
}

