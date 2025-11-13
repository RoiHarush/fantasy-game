package com.fantasy.domain.player;

import jakarta.persistence.*;

@Entity
@Table(name = "player_mapping")
public class PlayerMappingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int fplId;
    private int apiFootballId;
    private String fullName;
    private int teamId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getFplId() { return fplId; }
    public void setFplId(int fplId) { this.fplId = fplId; }

    public int getApiFootballId() { return apiFootballId; }
    public void setApiFootballId(int apiFootballId) { this.apiFootballId = apiFootballId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public int getTeamId() { return teamId; }
    public void setTeamId(int teamId) { this.teamId = teamId; }
}

