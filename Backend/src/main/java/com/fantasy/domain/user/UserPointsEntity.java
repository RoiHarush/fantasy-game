package com.fantasy.domain.user;

import jakarta.persistence.*;

@Entity
@Table(
        name = "user_points",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "gameweek"})
)
public class UserPointsEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int gameweek;
    private int points;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private UserEntity user;


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getGameweek() { return gameweek; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
}

