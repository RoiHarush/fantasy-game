package com.fantasy.domain.player;


public class PlayerDto {
    private int id;
    private String firstName;
    private String lastName;
    private String viewName;
    private String position;
    private int teamId;
    private int points;
    private boolean injured;
    private boolean available;
    private Integer ownerId;
    private String ownerName;

    private String news;
    private Integer chanceOfPlayingThisRound;
    private Integer chanceOfPlayingNextRound;
    private String photo;


    // Constructor
    public PlayerDto(int id, String firstName, String lastName, String viewName,
                     String position, int teamId,
                     int points, boolean isInjured, boolean available,
                     Integer ownerId, String ownerName, String news,
                     Integer chanceOfPlayingThisRound, Integer chanceOfPlayingNextRound,
                     String photo) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.viewName = viewName;
        this.position = position;
        this.teamId = teamId;
        this.points = points;
        this.injured = isInjured;
        this.available = available;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.news = news;
        this.chanceOfPlayingThisRound = chanceOfPlayingThisRound;
        this.chanceOfPlayingNextRound = chanceOfPlayingNextRound;
        this.photo = photo;
    }


    // Getters
    public int getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getViewName() { return viewName; }
    public String getPosition() { return position; }
    public int getTeamId() { return teamId; }
    public int getPoints() { return points; }
    public boolean isInjured() { return injured; }
    public boolean isAvailable() { return available; }
    public Integer getOwnerId() { return ownerId; }
    public String getOwnerName() { return ownerName; }
    public String getNews() { return news; }
    public Integer getChanceOfPlayingThisRound() { return chanceOfPlayingThisRound; }
    public Integer getChanceOfPlayingNextRound() { return chanceOfPlayingNextRound; }
    public String getPhoto() { return  photo; }
}
