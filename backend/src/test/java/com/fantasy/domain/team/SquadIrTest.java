package com.fantasy.domain.team;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SquadIrTest {

    @Test
    void allowsAHealthySquadPlayerToBeAssignedToIr() {
        Squad squad = new Squad();
        Player irPlayer = player(1, PlayerPosition.MIDFIELDER);
        Player captain = player(2, PlayerPosition.FORWARD);
        Player viceCaptain = player(3, PlayerPosition.DEFENDER);

        squad.makePick(irPlayer);
        squad.makePick(captain);
        squad.makePick(viceCaptain);

        Map<PlayerPosition, List<Player>> lineup = new EnumMap<>(PlayerPosition.class);
        for (PlayerPosition position : PlayerPosition.values()) {
            lineup.put(position, new ArrayList<>());
        }
        lineup.get(captain.getPosition()).add(captain);
        lineup.get(viceCaptain.getPosition()).add(viceCaptain);
        squad.setStartingLineup(lineup);

        Map<String, Player> bench = new LinkedHashMap<>();
        bench.put("GK", null);
        bench.put("S1", null);
        bench.put("S2", null);
        bench.put("S3", irPlayer);
        squad.setBench(bench);
        squad.setCaptain(captain);
        squad.setViceCaptain(viceCaptain);

        assertFalse(irPlayer.isInjured());

        squad.assignIR(irPlayer);

        assertEquals(irPlayer, squad.getIR());
        assertFalse(squad.getAllPlayers().contains(irPlayer));
    }

    private static Player player(int id, PlayerPosition position) {
        return new Player(id, "Test", "Player", position, id, "Player " + id);
    }
}
