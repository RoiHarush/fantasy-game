package com.fantasy.domain.league;

import com.fantasy.domain.user.User;

import java.util.Comparator;

public class UserByPointsComparator implements Comparator<User> {

    public int compare(User u1, User u2){
        return Integer.compare(u2.getTotalPoints(), u1.getTotalPoints());
    }
}
