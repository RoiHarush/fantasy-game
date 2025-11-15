package com.fantasy.dto;

public class FixtureSummaryDto {
    private String opponent;
    private Integer difficulty;
    private String kickoffTime;

    public FixtureSummaryDto(String opponent, Integer difficulty, String kickoffTime) {
        this.opponent = opponent;
        this.difficulty = difficulty;
        this.kickoffTime = kickoffTime;
    }

    public String getOpponent() { return opponent; }
    public void setOpponent(String opponent) { this.opponent = opponent; }

    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

    public String getKickoffTime() { return kickoffTime; }
    public void setKickoffTime(String kickoffTime) { this.kickoffTime = kickoffTime; }
}


