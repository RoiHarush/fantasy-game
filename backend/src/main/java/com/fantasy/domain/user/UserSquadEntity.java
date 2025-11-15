package com.fantasy.domain.user;

import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(
        name = "user_squads",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "gameweek"})
)
public class UserSquadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int gameweek;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_squad_starting", joinColumns = @JoinColumn(name = "squad_id"))
    @Column(name = "player_id")
    private List<Integer> startingLineup = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_squad_bench", joinColumns = @JoinColumn(name = "squad_id"))
    @MapKeyColumn(name = "slot_name")
    @Column(name = "player_id")
    private Map<String, Integer> benchMap = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_squad_formation", joinColumns = @JoinColumn(name = "squad_id"))
    @MapKeyColumn(name = "position")
    @Column(name = "count")
    private Map<String, Integer> formation = new HashMap<>();

    @Column(name = "captain_id")
    private Integer captainId;

    @Column(name = "vice_captain_id")
    private Integer viceCaptainId;

    @Column(name = "first_pick_id")
    private Integer firstPickId;

    @Column(name = "IR_id")
    private Integer irId;



    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getGameweek() { return gameweek; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public List<Integer> getStartingLineup() { return startingLineup; }
    public void setStartingLineup(List<Integer> startingLineup) { this.startingLineup = startingLineup; }

    public Map<String, Integer> getBenchMap() { return benchMap; }
    public void setBenchMap(Map<String, Integer> benchMap) { this.benchMap = benchMap; }

    public Map<String, Integer> getFormation() { return formation; }
    public void setFormation(Map<String, Integer> formation) { this.formation = formation; }

    public Integer getCaptainId() { return captainId; }
    public void setCaptainId(Integer captainId) { this.captainId = captainId; }

    public Integer getViceCaptainId() { return viceCaptainId; }
    public void setViceCaptainId(Integer viceCaptainId) { this.viceCaptainId = viceCaptainId; }

    public Integer getFirstPickId() {
        return firstPickId;
    }

    public void setFirstPickId(Integer firstPickId) {
        this.firstPickId = firstPickId;
    }

    public Integer getIrId() {
        return irId;
    }

    public void setIrId(Integer irId) {
        this.irId = irId;
    }
}
