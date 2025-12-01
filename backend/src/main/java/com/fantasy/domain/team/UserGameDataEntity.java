package com.fantasy.domain.team;

import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "user_game_data")
public class UserGameDataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String fantasyTeamName;
    private int totalPoints;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_watched_players", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "player_id")
    private List<Integer> watchedPlayers = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_chips", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "count")
    @MapKeyColumn(name = "chip_name")
    private Map<String, Integer> chips = new HashMap<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_active_chips", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "active")
    @MapKeyColumn(name = "chip_name")
    private Map<String, Boolean> activeChips = new HashMap<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<UserPointsEntity> pointsByGameweek = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "current_squad_id")
    private UserSquadEntity currentSquad;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "next_squad_id")
    private UserSquadEntity nextSquad;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;


    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getFantasyTeamName() { return fantasyTeamName; }
    public void setFantasyTeamName(String fantasyTeamName) { this.fantasyTeamName = fantasyTeamName; }
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
    public List<Integer> getWatchedPlayers() { return watchedPlayers; }
    public void setWatchedPlayers(List<Integer> watchedPlayers) { this.watchedPlayers = watchedPlayers; }
    public Map<String, Integer> getChips() { return chips; }
    public void setChips(Map<String, Integer> chips) { this.chips = chips; }
    public Map<String, Boolean> getActiveChips() { return activeChips; }
    public void setActiveChips(Map<String, Boolean> activeChips) { this.activeChips = activeChips; }
    public List<UserPointsEntity> getPointsByGameweek() { return pointsByGameweek; }
    public void setPointsByGameweek(List<UserPointsEntity> pointsByGameweek) { this.pointsByGameweek = pointsByGameweek; }
    public UserSquadEntity getCurrentSquad() { return currentSquad; }
    public void setCurrentSquad(UserSquadEntity currentSquad) { this.currentSquad = currentSquad; }
    public UserSquadEntity getNextSquad() { return nextSquad; }
    public void setNextSquad(UserSquadEntity nextSquad) { this.nextSquad = nextSquad; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
}
