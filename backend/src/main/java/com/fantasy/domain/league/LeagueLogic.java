package com.fantasy.domain.league;

import com.fantasy.domain.user.UserGameData;

import java.util.*;

//TODO: Add exceptions
public final class LeagueLogic {
    private static final String CHAR_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public static void sortUsers(List<UserGameData> orderedUsers) {
        orderedUsers.sort(new UserByPointsComparator());
    }

    public static String generateLeagueCode(int codeLength) {
        Random random = new Random();
        StringBuilder code = new StringBuilder();

        for (int i = 0; i < codeLength; i++) {
            int index = random.nextInt(CHAR_POOL.length());
            code.append(CHAR_POOL.charAt(index));
        }
        return code.toString();
    }

    public static boolean userEnter(String userCode, String leagueCode){
        return leagueCode.equals(userCode);
    }
}
