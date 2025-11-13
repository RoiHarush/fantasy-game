package com.fantasy.dto;

public class FixtureDto {
    private int id;
    private int event; // מספר מחזור
    private String kickoff_time;
    private int homeTeamId;
    private int awayTeamId;
    private Integer homeScore;
    private Integer awayScore;
    private boolean finished;

    public FixtureDto(int id, int event, String kickoff_time, int homeTeamId, int awayTeamId,
                      Integer homeScore, Integer awayScore, boolean finished) {
        this.id = id;
        this.event = event;
        this.kickoff_time = kickoff_time;
        this.homeTeamId = homeTeamId;
        this.awayTeamId = awayTeamId;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.finished = finished;
    }

    public int getId() { return id; }
    public int getEvent() { return event; }
    public String getKickoff_time() { return kickoff_time; }
    public int getHomeTeamId() { return homeTeamId; }
    public int getAwayTeamId() { return awayTeamId; }
    public Integer getHomeScore() { return homeScore; }
    public Integer getAwayScore() { return awayScore; }
    public boolean isFinished() { return finished; }
}
