package com.fantasy.domain.league;

import com.fantasy.domain.user.User;

import java.util.ArrayList;
import java.util.List;

public class League {
    private final String name;
    private final List<User> users;
    private final String leagueCode;
    private final User admin;

    public League(User admin, String name, String leagueCode) {
        this.admin = admin;
        this.name = name;
        this.leagueCode = leagueCode;
        this.users = new ArrayList<>();
        this.users.add(admin);
    }

    public String getName() { return name; }
    public User getAdmin() { return admin; }
    public List<User> getUsers() { return users; }
    public String getLeagueCode() { return leagueCode; }

    public void userEnter(User user, String userCode) {
        if (user != null && LeagueLogic.userEnter(userCode, this.leagueCode))
            this.users.add(user);
    }

    public void sortUsers() {
        LeagueLogic.sortUsers(users);
    }
}

