package com.fantasy.domain.player;

public enum PlayerPosition {
    GOALKEEPER(1, "GK"),
    DEFENDER(2, "DEF"),
    MIDFIELDER(3, "MID"),
    FORWARD(4, "FWD");

    private final int id;
    private final String code;

    PlayerPosition(int id, String code) {
        this.id = id;
        this.code = code;
    }

    public int getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public static PlayerPosition fromId(int id) {
        for (PlayerPosition pos : values()) {
            if (pos.id == id) return pos;
        }
        throw new IllegalArgumentException("Unknown PlayerPosition id: " + id);
    }

    public static PlayerPosition fromCode(String code) {
        for (PlayerPosition pos : values()) {
            if (pos.code.equalsIgnoreCase(code)) return pos;
        }
        throw new IllegalArgumentException("Unknown PlayerPosition code: " + code);
    }
}

