package com.fantasy.domain.realWorldData;

public enum TeamName {
    Arsenal(1, "ARS", "Arsenal"),
    Aston_Villa(2, "AVL", "Aston Villa"),
    Burnley(3, "BUR", "Burnley"),
    Bournemouth(4, "BOU", "Bournemouth"),
    Brentford(5, "BRE", "Brentford"),
    Brighton_And_Hove_Albion(6, "BHA", "Brighton"),
    Chelsea(7, "CHE", "Chelsea"),
    Crystal_Palace(8, "CRY", "Crystal Palace"),
    Everton(9, "EVE", "Everton"),
    Fulham(10, "FUL", "Fulham"),
    Leeds_United(11, "LEE", "Leeds"),
    Liverpool(12, "LIV", "Liverpool"),
    Manchester_City(13, "MCI", "Man City"),
    Manchester_United(14, "MUN", "Man Utd"),
    Newcastle_United(15, "NEW", "Newcastle"),
    Nottingham_Forest(16, "NFO", "Nott'm Forest"),
    Sunderland(17, "SUN", "Sunderland"),
    Tottenham_Hotspur(18, "TOT", "Spurs"),
    West_Ham(19, "WHU", "West Ham"),
    Wolverhampton_Wanderers(20, "WOL", "Wolves");

    private final int id;
    private final String code;
    private final String shortName;

    TeamName(int id, String code, String shortName) {
        this.id = id;
        this.code = code;
        this.shortName = shortName;
    }

    public int getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getShortName(){
        return shortName;
    }

    public static TeamName fromId(int id) {
        for (TeamName team : values()) {
            if (team.id == id) return team;
        }
        throw new IllegalArgumentException("Unknown TeamName id: " + id);
    }

    public static TeamName fromCode(String code) {
        for (TeamName team : values()) {
            if (team.code.equalsIgnoreCase(code)) return team;
        }
        throw new IllegalArgumentException("Unknown TeamName code: " + code);
    }

    public static TeamName fromShortName(String shortName) {
        for (TeamName team : values()) {
            if (team.shortName.equalsIgnoreCase(shortName)) return team;
        }
        throw new IllegalArgumentException("Unknown TeamName code: " + shortName);
    }

    public static int fromNameToId(String name){
        for (TeamName team : values()) {
            if (team.name().equalsIgnoreCase(name)) return team.getId();
        }
        throw new IllegalArgumentException("Unknown TeamName code: " + name);
    }
}
