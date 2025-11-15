package com.fantasy.dto;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.realWorldData.TeamEntity;

import java.util.Collections;
import java.util.List;

public class PlayerMatchStatsDto {

    private int playerId;
    private int gameweekId;
    private String playerName;

    private Integer homeTeamId;
    private Integer awayTeamId;

    private String homeTeamName;
    private String awayTeamName;

    private Integer homeScore;
    private Integer awayScore;

    private List<StatLine> stats;
    private boolean isCaptain;

    public static class StatLine {
        private String name;
        private String value;
        private int points;
        private String iconPath;

        public StatLine(String name, String value, int points) {
            this.name = name;
            this.value = value;
            this.points = points;
        }

        public StatLine(String name, String value, int points, String iconPath) {
            this.name = name;
            this.value = value;
            this.points = points;
            this.iconPath = iconPath;
        }

        public String getName() { return name; }
        public String getValue() { return value; }
        public int getPoints() { return points; }
        public String getIconPath() { return iconPath; }
    }

    public static PlayerMatchStatsDto empty(Player player, TeamEntity home, TeamEntity away, Integer homeScore, Integer awayScore) {
        PlayerMatchStatsDto dto = new PlayerMatchStatsDto();
        dto.setPlayerId(player.getId());
        dto.setPlayerName(player.getViewName());
        dto.setHomeTeamId(home != null ? home.getId() : null);
        dto.setAwayTeamId(away != null ? away.getId() : null);
        dto.setHomeTeamName(home != null ? home.getName() : "TBD");
        dto.setAwayTeamName(away != null ? away.getName() : "TBD");
        dto.setHomeScore(homeScore);
        dto.setAwayScore(awayScore);
        dto.setStats(Collections.emptyList());
        dto.setCaptain(false);
        return dto;
    }

    // Getters / Setters
    public int getPlayerId() { return playerId; }
    public void setPlayerId(int playerId) { this.playerId = playerId; }

    public int getGameweekId() { return gameweekId; }
    public void setGameweekId(int gameweekId) { this.gameweekId = gameweekId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public Integer getHomeTeamId() { return homeTeamId; }
    public void setHomeTeamId(Integer homeTeamId) { this.homeTeamId = homeTeamId; }

    public Integer getAwayTeamId() { return awayTeamId; }
    public void setAwayTeamId(Integer awayTeamId) { this.awayTeamId = awayTeamId; }

    public String getHomeTeamName() { return homeTeamName; }
    public void setHomeTeamName(String homeTeamName) { this.homeTeamName = homeTeamName; }

    public String getAwayTeamName() { return awayTeamName; }
    public void setAwayTeamName(String awayTeamName) { this.awayTeamName = awayTeamName; }

    public Integer getHomeScore() { return homeScore; }
    public void setHomeScore(Integer homeScore) { this.homeScore = homeScore; }

    public Integer getAwayScore() { return awayScore; }
    public void setAwayScore(Integer awayScore) { this.awayScore = awayScore; }

    public List<StatLine> getStats() { return stats; }
    public void setStats(List<StatLine> stats) { this.stats = stats; }

    public boolean isCaptain() { return isCaptain; }
    public void setCaptain(boolean captain) { isCaptain = captain; }
}
