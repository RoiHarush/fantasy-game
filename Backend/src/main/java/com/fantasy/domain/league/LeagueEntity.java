package com.fantasy.domain.league;

import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leagues")
public class LeagueEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String leagueCode;
    private int gameweek;

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

    public LeagueEntity() {}

    public LeagueEntity(String name, String leagueCode, UserEntity admin, int gameweek, List<UserEntity> users) {
        this.name = name;
        this.leagueCode = leagueCode;
        this.admin = admin;
        this.gameweek = gameweek;
        this.users = users;
    }

    public int getGameweek() { return gameweek; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getLeagueCode() { return leagueCode; }
    public UserEntity getAdmin() { return admin; }
    public List<UserEntity> getUsers() { return users; }
    public void addUser(UserEntity user) { users.add(user); }

    public void setName(String name) { this.name = name; }
    public void setLeagueCode(String leagueCode) { this.leagueCode = leagueCode; }
    public void setAdmin(UserEntity admin) { this.admin = admin; }
    public void setUsers(List<UserEntity> users) { this.users = users; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }

}
