package com.fantasy.Simulations.Utils;

import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.User.User;

import java.util.ArrayList;
import java.util.List;

public class TestUserFactory {

    private static final String[] NAMES = {
            "Omri",
            "Yaniv",
            "Itamar",
            "Yakoel",
            "Ifrah",
            "Eden",
            "Tepper"
    };

    private static final String[] USER_NAMES = {
            "O1",
            "Y2",
            "I3",
            "Y4",
            "I5",
            "E6",
            "T7"
    };

    private static final String[] PASSWORDS = {
            "11111",
            "22222",
            "33333",
            "44444",
            "55555",
            "66666",
            "77777"
    };

    private static final String[] TEAMS_NAMES = {
            "HAPOEL ZIDON UTD",
            "THE JEWS",
            "SUSITA FC",
            "YAKOEL FC",
            "MONA LISA",
            "WINNER FC",
            "MACCABI TEPPER UTD"
    };

    public static List<User> generateUsers(int amountOfUsers){
        List<User> users = new ArrayList<>();
        for (int i = 0; i < amountOfUsers; i++) {
            User user = new User(NAMES[i], USER_NAMES[i], PASSWORDS[i]);
            user.setFantasyTeam(new FantasyTeam(TEAMS_NAMES[i], 0));
            users.add(user);
        }
        return users;
    }


}
