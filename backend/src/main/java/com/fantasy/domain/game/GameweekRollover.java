package com.fantasy.domain.game;

import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.UserGameData;

import java.util.*;

public class GameweekRollover {

    public static void rolloverToNextGameweek(UserGameData user, int gameweek){
        FantasyTeam next = user.getNextFantasyTeam();

        if (next == null)
            throw new RuntimeException("UserGameData dont have squads!");

        Squad newSquad = copySquad(next.getSquad());

        FantasyTeam newTeam = new FantasyTeam(gameweek + 1, newSquad);
        user.setCurrentFantasyTeam(next);
        user.setNextFantasyTeam(newTeam);
        Map<String, Boolean> activeChips = user.getActiveChips();
        activeChips.put("FIRST_PICK_CAPTAIN", false);
        user.setActiveChips(activeChips);
        user.getPointsByGameweek().put(gameweek, 0);
    }

    private static Squad copySquad(Squad squad){
        PlayerRegistry pr = new PlayerRegistry();
        Map<PlayerPosition, List<Player>> starting = new HashMap<>();
        Map<String, Player> bench = new LinkedHashMap<>();

        starting.put(PlayerPosition.GOALKEEPER, new ArrayList<>());
        starting.put(PlayerPosition.DEFENDER, new ArrayList<>());
        starting.put(PlayerPosition.MIDFIELDER, new ArrayList<>());
        starting.put(PlayerPosition.FORWARD, new ArrayList<>());

        for (PlayerPosition pp : PlayerPosition.values()){
            for (Player player : squad.getStartingLineup().get(pp)){
                starting.get(pp).add(player);
                pr.add(player);
            }
        }

        for (String key : squad.getBench().keySet()){
            bench.put(key, squad.getBench().get(key));
            pr.add(squad.getBench().get(key));
        }

        Squad result = new Squad();
        result.setAllPlayers(pr);
        result.setStartingLineup(starting);
        result.setBench(bench);
        result.setFirstPick(squad.getFirstPick());
        if (squad.getCaptain().equals(squad.getFirstPick()))
            result.setDefaultCaptain();
        else
            result.setCaptain(squad.getCaptain());
        result.setViceCaptain(squad.getViceCaptain());
        result.setIR(squad.getIR());

        return result;
    }
}
