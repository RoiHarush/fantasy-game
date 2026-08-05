package com.fantasy.domain.score;

import java.util.List;

public record PlayerScoreBreakdown(int totalPoints, List<Line> lines) {

    public PlayerScoreBreakdown {
        lines = List.copyOf(lines);
    }

    public record Line(String label, int count, int points) {}
}
