package com.fantasy.domain.ai;

import com.fantasy.domain.team.SquadDto;
import java.time.LocalDateTime;
import java.util.List;

public record CoachAnalysisDto(
        boolean enabled,
        int gameweek,
        String snapshotHash,
        LocalDateTime dataAsOf,
        boolean generatedByAi,
        String summary,
        SquadDto recommendedSquad,
        List<PlayerScore> playerScores,
        List<TransferSuggestion> transfers,
        ChipSuggestion chipSuggestion,
        List<String> warnings,
        Quota quota,
        List<Message> messages
) {
    public record PlayerScore(int playerId, String playerName, String position, double score,
                              int nextFixtureDifficulty, int availability, String reason) {}
    public record TransferSuggestion(int playerOutId, String playerOutName, int playerInId,
                                     String playerInName, String position, double improvement,
                                     String reason, String orderConfidence) {}
    public record ChipSuggestion(String chipName, String recommendation, String reason, String confidence) {}
    public record Quota(int analysesRemainingToday, int followupsRemainingThisGameweek) {}
    public record Message(String role, String content, LocalDateTime createdAt) {}
}
