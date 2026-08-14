package com.fantasy.domain.team;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SquadFirstPickCaptainTest {

    @Test
    void activeFirstPickCaptainRequiresTheFirstPickToStartAndRemainCaptain() {
        Squad squad = validSquad();
        Player firstPick = squad.getFirstPick();
        Player reserveGoalkeeper = squad.getBench().get("GK");

        assertTrue(squad.validate(true));

        squad.getStartingLineup().put(PlayerPosition.GOALKEEPER, new ArrayList<>(List.of(reserveGoalkeeper)));
        squad.getBench().put("GK", firstPick);
        assertFalse(squad.validate(true));

        squad.getStartingLineup().put(PlayerPosition.GOALKEEPER, new ArrayList<>(List.of(firstPick)));
        squad.getBench().put("GK", reserveGoalkeeper);
        squad.setCaptain(squad.getStartingLineup().get(PlayerPosition.DEFENDER).getFirst());
        assertFalse(squad.validate(true));
    }

    @Test
    void cannotActivateFirstPickCaptainWhileTheFirstPickIsBenched() {
        Squad squad = validSquad();
        Player firstPick = squad.getFirstPick();
        Player reserveGoalkeeper = squad.getBench().get("GK");
        squad.getStartingLineup().put(PlayerPosition.GOALKEEPER, new ArrayList<>(List.of(reserveGoalkeeper)));
        squad.getBench().put("GK", firstPick);

        assertFalse(squad.isFirstPickStarting());
        assertThrows(IllegalStateException.class, squad::signFirstPickCaptain);
    }

    private static Squad validSquad() {
        Squad squad = new Squad();
        Player firstPick = player(1, PlayerPosition.GOALKEEPER);
        Player reserveGoalkeeper = player(2, PlayerPosition.GOALKEEPER);
        List<Player> defenders = players(3, 4, PlayerPosition.DEFENDER);
        List<Player> midfielders = players(7, 3, PlayerPosition.MIDFIELDER);
        List<Player> forwards = players(10, 3, PlayerPosition.FORWARD);

        Map<PlayerPosition, List<Player>> lineup = new EnumMap<>(PlayerPosition.class);
        for (PlayerPosition position : PlayerPosition.values()) {
            lineup.put(position, new ArrayList<>());
        }
        lineup.get(PlayerPosition.GOALKEEPER).add(firstPick);
        lineup.get(PlayerPosition.DEFENDER).addAll(defenders);
        lineup.get(PlayerPosition.MIDFIELDER).addAll(midfielders);
        lineup.get(PlayerPosition.FORWARD).addAll(forwards);
        squad.setStartingLineup(lineup);

        Map<String, Player> bench = new LinkedHashMap<>();
        bench.put("GK", reserveGoalkeeper);
        squad.setBench(bench);
        squad.setFirstPick(firstPick);
        squad.setCaptain(firstPick);
        squad.setViceCaptain(defenders.getFirst());
        return squad;
    }

    private static List<Player> players(int firstId, int count, PlayerPosition position) {
        List<Player> result = new ArrayList<>();
        for (int offset = 0; offset < count; offset++) {
            result.add(player(firstId + offset, position));
        }
        return result;
    }

    private static Player player(int id, PlayerPosition position) {
        return new Player(id, "Test", "Player", position, id, "Player " + id);
    }
}
