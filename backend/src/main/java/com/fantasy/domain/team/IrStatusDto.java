package com.fantasy.domain.team;

public class IrStatusDto {
    private int userId;
    private String userName;
    private String teamName;
    private boolean hasIr;
    private String irPlayerName;

    public IrStatusDto(int userId, String userName, String teamName, boolean hasIr, String irPlayerName) {
        this.userId = userId;
        this.userName = userName;
        this.teamName = teamName;
        this.hasIr = hasIr;
        this.irPlayerName = irPlayerName;
    }

    public int getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getTeamName() { return teamName; }
    public boolean isHasIr() { return hasIr; }
    public String getIrPlayerName() { return irPlayerName; }
}
