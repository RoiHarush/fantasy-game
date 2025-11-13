package com.fantasy.domain.player;

import jakarta.persistence.*;

@Entity
@Table(name = "player_points", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id","gameweek"}))
public class PlayerPointsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private PlayerEntity player;

    private int gameweek;
    private int points;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PlayerEntity getPlayer() { return player; }
    public void setPlayer(PlayerEntity player) { this.player = player; }

    public int getGameweek() { return gameweek; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}
