package com.fantasy.domain.player;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "players")
public class PlayerEntity {

    @Id
    private Integer id;

    private String firstName;
    private String lastName;
    private String viewName;

    @Enumerated(EnumType.STRING)
    private PlayerPosition position;

    private Integer teamId;

    private boolean injured;
    private int totalPoints;

    @Column(length = 255)
    private String news;

    @Column(name = "chance_of_playing_this_round")
    private Integer chanceOfPlayingThisRound;

    @Column(name = "chance_of_playing_next_round")
    private Integer chanceOfPlayingNextRound;

    private LocalDateTime newsAdded;

    private String photo;

    private LocalDateTime firstSeenAt;

    private double form;
    private double pointsPerGame;
    private double selectedByPercent;
    private double expectedGoals;
    private double expectedAssists;
    private double expectedGoalInvolvements;
    private double expectedGoalsConceded;
    private double influence;
    private double creativity;
    private double threat;
    private double ictIndex;
    private int nowCost;
    private LocalDateTime metricsUpdatedAt;


    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getViewName() { return viewName; }
    public void setViewName(String viewName) { this.viewName = viewName; }

    public PlayerPosition getPosition() { return position; }
    public void setPosition(PlayerPosition position) { this.position = position; }

    public Integer getTeamId() { return teamId; }
    public void setTeamId(Integer teamId) { this.teamId = teamId; }

    public boolean isInjured() { return injured; }
    public void setInjured(boolean injured) { this.injured = injured; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public String getNews() { return news; }
    public void setNews(String news) { this.news = news; }

    public Integer getChanceOfPlayingThisRound() { return chanceOfPlayingThisRound; }
    public void setChanceOfPlayingThisRound(Integer chanceOfPlayingThisRound) { this.chanceOfPlayingThisRound = chanceOfPlayingThisRound; }

    public Integer getChanceOfPlayingNextRound() { return chanceOfPlayingNextRound; }
    public void setChanceOfPlayingNextRound(Integer chanceOfPlayingNextRound) { this.chanceOfPlayingNextRound = chanceOfPlayingNextRound; }

    public LocalDateTime getNewsAdded() { return newsAdded; }
    public void setNewsAdded(LocalDateTime newsAdded) { this.newsAdded = newsAdded; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public LocalDateTime getFirstSeenAt() { return firstSeenAt; }
    public void setFirstSeenAt(LocalDateTime firstSeenAt) { this.firstSeenAt = firstSeenAt; }
    public double getForm() { return form; }
    public void setForm(double form) { this.form = form; }
    public double getPointsPerGame() { return pointsPerGame; }
    public void setPointsPerGame(double pointsPerGame) { this.pointsPerGame = pointsPerGame; }
    public double getSelectedByPercent() { return selectedByPercent; }
    public void setSelectedByPercent(double selectedByPercent) { this.selectedByPercent = selectedByPercent; }
    public double getExpectedGoals() { return expectedGoals; }
    public void setExpectedGoals(double expectedGoals) { this.expectedGoals = expectedGoals; }
    public double getExpectedAssists() { return expectedAssists; }
    public void setExpectedAssists(double expectedAssists) { this.expectedAssists = expectedAssists; }
    public double getExpectedGoalInvolvements() { return expectedGoalInvolvements; }
    public void setExpectedGoalInvolvements(double expectedGoalInvolvements) { this.expectedGoalInvolvements = expectedGoalInvolvements; }
    public double getExpectedGoalsConceded() { return expectedGoalsConceded; }
    public void setExpectedGoalsConceded(double expectedGoalsConceded) { this.expectedGoalsConceded = expectedGoalsConceded; }
    public double getInfluence() { return influence; }
    public void setInfluence(double influence) { this.influence = influence; }
    public double getCreativity() { return creativity; }
    public void setCreativity(double creativity) { this.creativity = creativity; }
    public double getThreat() { return threat; }
    public void setThreat(double threat) { this.threat = threat; }
    public double getIctIndex() { return ictIndex; }
    public void setIctIndex(double ictIndex) { this.ictIndex = ictIndex; }
    public int getNowCost() { return nowCost; }
    public void setNowCost(int nowCost) { this.nowCost = nowCost; }
    public LocalDateTime getMetricsUpdatedAt() { return metricsUpdatedAt; }
    public void setMetricsUpdatedAt(LocalDateTime metricsUpdatedAt) { this.metricsUpdatedAt = metricsUpdatedAt; }
}
