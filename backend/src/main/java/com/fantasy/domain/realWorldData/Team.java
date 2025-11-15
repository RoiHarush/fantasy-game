package com.fantasy.domain.realWorldData;

import com.fantasy.domain.intefaces.ITeam;

//TODO: Add exceptions
public class Team implements ITeam {
    private final int id;
    private final String name;
    private final String code;
    private final String shortName;

    public Team(int id, String name, String code, String shortName) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.shortName = shortName;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getShortName() { return shortName; }

    @Override
    public String toString() {
        return name + " (" + code + ")";
    }
}
