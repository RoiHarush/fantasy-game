package com.fantasy.dto;

public class UserDto {
    private int id;
    private String name;
    private String fantasyTeam;
    private String logoPath;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFantasyTeam() { return fantasyTeam; }
    public void setFantasyTeam(String fantasyTeam) { this.fantasyTeam = fantasyTeam; }

    public String getLogoPath() {
        return logoPath;
    }
    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }
}
