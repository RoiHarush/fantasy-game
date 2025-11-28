package com.fantasy.dto;

public class UserDto {
    private int id;
    private String name;
    private String username;
    private String fantasyTeamName;
    private String logoPath;
    private String role;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    public String getFantasyTeamName() { return fantasyTeamName; }
    public void setFantasyTeamName(String fantasyTeamName) { this.fantasyTeamName = fantasyTeamName; }

    public String getLogoPath() {
        return logoPath;
    }
    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
