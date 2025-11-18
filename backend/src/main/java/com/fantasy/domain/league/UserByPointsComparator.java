package com.fantasy.domain.league;

import com.fantasy.domain.user.UserGameData;

import java.util.Comparator;

public class UserByPointsComparator implements Comparator<UserGameData> {

    public int compare(UserGameData u1, UserGameData u2){
        return Integer.compare(u2.getTotalPoints(), u1.getTotalPoints());
    }
}
