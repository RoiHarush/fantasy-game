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

    @Enumerated(EnumType.STRING)
    private PlayerState state;

    private boolean injured;
    private Integer ownerId;
    private int totalPoints;

    @Column(length = 255)
    private String news;

    @Column(name = "chance_of_playing_this_round")
    private Integer chanceOfPlayingThisRound;

    @Column(name = "chance_of_playing_next_round")
    private Integer chanceOfPlayingNextRound;

    private LocalDateTime newsAdded;

    private String photo;


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

    public PlayerState getState() { return state; }
    public void setState(PlayerState state) { this.state = state; }

    public boolean isInjured() { return injured; }
    public void setInjured(boolean injured) { this.injured = injured; }

    public Integer getOwnerId() { return ownerId; }
    public void setOwnerId(Integer ownerId) { this.ownerId = ownerId; }

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
}
