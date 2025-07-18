package com.fantasy.RealWorldData;

public enum TeamName {
    Arsenal(1, "ARS"),
    Aston_Villa(2, "AVL"),
    Bournemouth(3, "BOU"),
    Brentford(4, "BRE"),
    Brighton_And_Hove_Albion(5, "BHA"),
    Burnley(6, "BUR"),
    Chelsea(7, "CHE"),
    Crystal_Palace(8, "CRY"),
    Everton(9, "EVE"),
    Fulham(10, "FUL"),
    Leeds_United(11, "LUN"),
    Liverpool(12, "LIV"),
    Manchester_City(13, "MCI"),
    Manchester_United(14, "MUN"),
    Newcastle_United(15, "NEW"),
    Nottingham_Forest(16, "NFO"),
    Sunderland(17, "SUN"),
    Tottenham_Hotspur(18, "TOT"),
    West_Ham(19, "WHU"),
    Wolverhampton_Wanderers(20, "WOL");

    private final int id;
    private final String code;

    TeamName(int id, String code) {
        this.id = id;
        this.code = code;
    }

    public int getId() {
        return id;
    }

    public String getCode() {
        return code;
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
}
