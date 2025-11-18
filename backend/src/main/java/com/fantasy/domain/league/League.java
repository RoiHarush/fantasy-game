package com.fantasy.domain.league;

import com.fantasy.domain.user.UserGameData;

import java.util.ArrayList;
import java.util.List;

public class League {
    private final String name;
    private final List<UserGameData> users;
    private final String leagueCode;
    private final UserGameData admin;

    public League(UserGameData admin, String name, String leagueCode) {
        this.admin = admin;
        this.name = name;
        this.leagueCode = leagueCode;
        this.users = new ArrayList<>();
        this.users.add(admin);
    }

    public String getName() { return name; }
    public UserGameData getAdmin() { return admin; }
    public List<UserGameData> getUsers() { return users; }
    public String getLeagueCode() { return leagueCode; }

    public void userEnter(UserGameData user, String userCode) {
        if (user != null && LeagueLogic.userEnter(userCode, this.leagueCode))
            this.users.add(user);
    }

    public void sortUsers() {
        LeagueLogic.sortUsers(users);
    }
}

