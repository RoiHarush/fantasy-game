package com.fantasy.domain.league;

import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "leagues", uniqueConstraints = @UniqueConstraint(columnNames = "league_code"))
public class LeagueEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(name = "league_code", nullable = false, unique = true, length = 12)
    private String leagueCode;

    @Column(nullable = false, columnDefinition = "integer default 8")
    private int maxParticipants = 8;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24, columnDefinition = "varchar(24) default 'ACTIVE'")
    private LeagueStatus status = LeagueStatus.WAITING_FOR_DRAFT;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private UserEntity admin;

    @ManyToMany
    @JoinTable(
            name = "league_users",
            joinColumns = @JoinColumn(name = "league_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<UserEntity> users = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "league_scoring_rules", joinColumns = @JoinColumn(name = "league_id"))
    @MapKeyColumn(name = "rule_key")
    @Column(name = "points", nullable = false)
    private Map<String, Integer> scoringRules = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "league_player_positions", joinColumns = @JoinColumn(name = "league_id"))
    @MapKeyColumn(name = "player_id")
    @Column(name = "position", nullable = false, length = 16)
    @Enumerated(EnumType.STRING)
    private Map<Integer, PlayerPosition> playerPositionOverrides = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "league_locked_players", joinColumns = @JoinColumn(name = "league_id"))
    @Column(name = "player_id", nullable = false)
    private Set<Integer> lockedPlayerIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "league_player_assist_adjustments", joinColumns = @JoinColumn(name = "league_id"))
    @MapKeyColumn(name = "player_gameweek_key", length = 32)
    @Column(name = "assist_adjustment", nullable = false)
    private Map<String, Integer> playerAssistAdjustments = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "league_player_penalty_adjustments", joinColumns = @JoinColumn(name = "league_id"))
    @MapKeyColumn(name = "player_gameweek_key", length = 32)
    @Column(name = "penalty_adjustment", nullable = false)
    private Map<String, Integer> playerPenaltyAdjustments = new HashMap<>();

    public LeagueEntity() {}

    public LeagueEntity(String name, String leagueCode, UserEntity admin, List<UserEntity> users) {
        this.name = name;
        this.leagueCode = leagueCode;
        this.admin = admin;
        this.users = users;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public String getLeagueCode() { return leagueCode; }
    public UserEntity getAdmin() { return admin; }
    public List<UserEntity> getUsers() { return users; }
    public int getMaxParticipants() { return maxParticipants; }
    public Map<String, Integer> getScoringRules() { return scoringRules; }
    public Map<Integer, PlayerPosition> getPlayerPositionOverrides() { return playerPositionOverrides; }
    public Set<Integer> getLockedPlayerIds() { return lockedPlayerIds; }
    public Map<String, Integer> getPlayerAssistAdjustments() { return playerAssistAdjustments; }
    public Map<String, Integer> getPlayerPenaltyAdjustments() { return playerPenaltyAdjustments; }
    public LeagueStatus getStatus() { return status; }
    public void addUser(UserEntity user) { users.add(user); }
    public void removeUser(UserEntity user) { users.remove(user); }

    public void setName(String name) { this.name = name; }
    public void setLeagueCode(String leagueCode) { this.leagueCode = leagueCode; }
    public void setAdmin(UserEntity admin) { this.admin = admin; }
    public void setUsers(List<UserEntity> users) { this.users = users; }
    public void setMaxParticipants(int maxParticipants) { this.maxParticipants = maxParticipants; }
    public void setScoringRules(Map<String, Integer> scoringRules) { this.scoringRules = scoringRules; }
    public void setStatus(LeagueStatus status) { this.status = Objects.requireNonNull(status); }

    public PlayerPosition effectivePosition(PlayerEntity player) {
        return playerPositionOverrides.getOrDefault(player.getId(), player.getPosition());
    }

    public void setPlayerPosition(PlayerEntity player, PlayerPosition position) {
        if (position == player.getPosition()) {
            playerPositionOverrides.remove(player.getId());
        } else {
            playerPositionOverrides.put(player.getId(), position);
        }
    }

    public boolean isPlayerLocked(int playerId) {
        return lockedPlayerIds.contains(playerId);
    }

    public void setPlayerLocked(int playerId, boolean locked) {
        if (locked) lockedPlayerIds.add(playerId);
        else lockedPlayerIds.remove(playerId);
    }

    public int effectiveAssists(int playerId, int gameweek, int sourceAssists) {
        return Math.max(0, sourceAssists + playerAssistAdjustments.getOrDefault(assistKey(playerId, gameweek), 0));
    }

    public int adjustAssists(int playerId, int gameweek, int sourceAssists, int delta) {
        String key = assistKey(playerId, gameweek);
        int adjustment = playerAssistAdjustments.getOrDefault(key, 0);
        int updatedAssists = sourceAssists + adjustment + delta;
        if (updatedAssists < 0) {
            throw new IllegalArgumentException("Assist count cannot be negative");
        }
        int updatedAdjustment = adjustment + delta;
        if (updatedAdjustment == 0) playerAssistAdjustments.remove(key);
        else playerAssistAdjustments.put(key, updatedAdjustment);
        return updatedAssists;
    }

    public int effectivePenaltiesConceded(int playerId, int gameweek, int sourcePenalties) {
        return Math.max(0, sourcePenalties + playerPenaltyAdjustments.getOrDefault(playerGameweekKey(playerId, gameweek), 0));
    }

    public int adjustPenaltiesConceded(int playerId, int gameweek, int sourcePenalties, int delta) {
        String key = playerGameweekKey(playerId, gameweek);
        int adjustment = playerPenaltyAdjustments.getOrDefault(key, 0);
        int updatedPenalties = sourcePenalties + adjustment + delta;
        if (updatedPenalties < 0) {
            throw new IllegalArgumentException("Penalty count cannot be negative");
        }
        int updatedAdjustment = adjustment + delta;
        if (updatedAdjustment == 0) playerPenaltyAdjustments.remove(key);
        else playerPenaltyAdjustments.put(key, updatedAdjustment);
        return updatedPenalties;
    }

    private String assistKey(int playerId, int gameweek) {
        return playerGameweekKey(playerId, gameweek);
    }

    private String playerGameweekKey(int playerId, int gameweek) {
        return playerId + ":" + gameweek;
    }
}
