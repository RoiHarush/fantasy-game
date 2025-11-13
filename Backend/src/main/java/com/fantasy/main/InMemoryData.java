package com.fantasy.main;

import com.fantasy.domain.league.League;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.FantasyUserRegistry;

public class InMemoryData {
    private static PlayerRegistry players = new PlayerRegistry();
    private static FantasyUserRegistry users = new FantasyUserRegistry();
    private static League activeLeague;

    public static PlayerRegistry getPlayers() {
        return players;
    }

    public static void setPlayers(PlayerRegistry pr) {
        players = pr;
    }

    public static FantasyUserRegistry getUsers() {
        return users;
    }

    public static void setUsers(FantasyUserRegistry ur) {
        users = ur;
    }

    public static League getActiveLeague() {
        return activeLeague;
    }

    public static void setActiveLeague(League league) {
        activeLeague = league;
    }

    public static boolean hasActiveLeague() {
        return activeLeague != null;
    }

    public static void clearActiveLeague() {
        activeLeague = null;
    }
}

