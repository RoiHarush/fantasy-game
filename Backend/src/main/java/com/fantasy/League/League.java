package com.fantasy.League;

import com.fantasy.User.User;

import java.util.ArrayList;
import java.util.List;

public class League {
    private List<User> users;
    private final String leagueCode;
    private final User admin;

    public League(User admin){
        this.admin = admin;
        (this.users = new ArrayList<>()).add(admin);
        this.leagueCode = LeagueLogic.generateLeagueCode(6);
    }

    public User getAdmin(){
        return this.admin;
    }

    public void userEnter(User user, String userCode){
        if (user != null && LeagueLogic.userEnter(userCode, this.leagueCode))
            this.users.add(user);
    }

    public void getOrderedList(){
        LeagueLogic.sortUsers(this.users);
    }

    @Override
    public String toString() {
        StringBuilder result = new StringBuilder();
        for (User user : this.users) {
            result.append(user.getName());
            result.append(user.getFantasyTeam().getName());
            result.append(user.getFantasyTeam().getTotalPoints());
            result.append('\n');
        }
        return result.toString();
    }
}
