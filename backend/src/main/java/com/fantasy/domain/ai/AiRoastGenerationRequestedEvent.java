package com.fantasy.domain.ai;

public record AiRoastGenerationRequestedEvent(long leagueId, int gameweek, boolean finalVersion) {
}
