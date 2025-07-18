package com.fantasy.League;

import com.fantasy.User.User;

import java.util.Comparator;

public class UserByPointsComparator implements Comparator<User> {

    public int compare(User u1, User u2){
        return Integer.compare(u1.getFantasyTeam().getTotalPoints(),
                u2.getFantasyTeam().getTotalPoints());
    }
}
