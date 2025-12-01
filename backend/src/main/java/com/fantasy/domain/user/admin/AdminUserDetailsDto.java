package com.fantasy.domain.user.admin;

import com.fantasy.domain.user.UserRole;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AdminUserDetailsDto {
    private int userId;
    private String username;
    private String password;
    private String name;
    private UserRole role;
    private LocalDateTime registeredAt;

    private String fantasyTeamName;
    private int totalPoints;

    private Map<String, Integer> chips;
    private Map<String, Boolean> activeChips;
    private List<GameweekPointsDto> gameweekPoints;

    public AdminUserDetailsDto() {}

    // --- Getters and Setters ---
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public String getFantasyTeamName() { return fantasyTeamName; }
    public void setFantasyTeamName(String fantasyTeamName) { this.fantasyTeamName = fantasyTeamName; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public Map<String, Integer> getChips() { return chips; }
    public void setChips(Map<String, Integer> chips) { this.chips = chips; }

    public Map<String, Boolean> getActiveChips() { return activeChips; }
    public void setActiveChips(Map<String, Boolean> activeChips) { this.activeChips = activeChips; }

    public List<GameweekPointsDto> getGameweekPoints() { return gameweekPoints; }
    public void setGameweekPoints(List<GameweekPointsDto> gameweekPoints) { this.gameweekPoints = gameweekPoints; }

    public static class GameweekPointsDto {
        private int gameweek;
        private int points;
        private long pointsEntityId;

        public GameweekPointsDto() {}
        public GameweekPointsDto(int gameweek, int points, long pointsEntityId) {
            this.gameweek = gameweek;
            this.points = points;
            this.pointsEntityId = pointsEntityId;
        }
        public int getGameweek() { return gameweek; }
        public void setGameweek(int gameweek) { this.gameweek = gameweek; }
        public int getPoints() { return points; }
        public void setPoints(int points) { this.points = points; }
        public long getPointsEntityId() { return pointsEntityId; }
        public void setPointsEntityId(long pointsEntityId) { this.pointsEntityId = pointsEntityId; }
    }
}