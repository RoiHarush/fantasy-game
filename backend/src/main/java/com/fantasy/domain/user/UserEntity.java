package com.fantasy.domain.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    private Integer id;

    private String name;
    private String fantasyTeamName;
    private int totalPoints;
    private LocalDateTime registeredAt = LocalDateTime.now();

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

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    // ----------------------------------------------------

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFantasyTeamName() { return fantasyTeamName; }
    public void setFantasyTeamName(String fantasyTeamName) { this.fantasyTeamName = fantasyTeamName; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public List<Integer> getWatchedPlayers() {
        return watchedPlayers == null ? new ArrayList<>() : watchedPlayers;
    }
    public void setWatchedPlayers(List<Integer> watchedPlayers) { this.watchedPlayers = watchedPlayers; }

    public List<UserPointsEntity> getPointsByGameweek() {
        return pointsByGameweek == null ? new ArrayList<>() : pointsByGameweek;
    }
    public void setPointsByGameweek(List<UserPointsEntity> pointsByGameweek) { this.pointsByGameweek = pointsByGameweek; }

    public UserSquadEntity getCurrentSquad() { return currentSquad; }
    public void setCurrentSquad(UserSquadEntity currentSquad) { this.currentSquad = currentSquad; }

    public UserSquadEntity getNextSquad() { return nextSquad; }
    public void setNextSquad(UserSquadEntity nextSquad) { this.nextSquad = nextSquad; }

    public Map<String, Integer> getChips() {
        return chips == null ? new HashMap<>() : chips;
    }
    public void setChips(Map<String, Integer> chips) {
        this.chips = chips;
    }

    public Map<String, Boolean> getActiveChips() {
        return activeChips;
    }
    public void setActiveChips(Map<String, Boolean> activeChips) {
        this.activeChips = activeChips;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
