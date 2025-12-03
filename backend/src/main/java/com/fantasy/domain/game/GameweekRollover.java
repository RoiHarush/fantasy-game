package com.fantasy.domain.game;

import com.fantasy.domain.team.FantasyTeam;
import com.fantasy.domain.team.Squad;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.team.UserGameData;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GameweekRollover {

    private static final Logger logger = LoggerFactory.getLogger(GameweekRollover.class);

    public static void rolloverToNextGameweek(UserGameData user, int currentGameweek) {
        int targetGameweek = currentGameweek + 1;

        if (user.getNextFantasyTeam() != null && user.getNextFantasyTeam().getGameweek() == targetGameweek) {
            logger.info("Skipping rollover for user {}: Next team already exists for GW {}", user.getId(), targetGameweek);
            return;
        }

        FantasyTeam teamBecomingCurrent = user.getNextFantasyTeam();

        if (teamBecomingCurrent == null) {
            logger.error("Critical failure: User {} has no 'next' squad prepared for rollover!", user.getId());
            throw new RuntimeException("UserGameData " + user.getId() + " has no next squad prepared!");
        }

        Squad newSquad = copySquad(teamBecomingCurrent.getSquad());

        FantasyTeam newNextTeam = new FantasyTeam(targetGameweek, newSquad);

        user.setCurrentFantasyTeam(teamBecomingCurrent);
        user.setNextFantasyTeam(newNextTeam);

        Map<String, Boolean> activeChips = user.getActiveChips();
        if (activeChips != null) {
            activeChips.put("FIRST_PICK_CAPTAIN", false);
            user.setActiveChips(activeChips);
        }

        user.getPointsByGameweek().put(currentGameweek, 0);

        logger.debug("Rollover successful for user {} to GW {}", user.getId(), targetGameweek);
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
