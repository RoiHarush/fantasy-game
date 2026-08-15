package com.fantasy.domain.team;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.team.Exceptions.IRException;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserGameDataChipTest {

    @Test
    void initializesTheNewSeasonChipsForExistingGameData() {
        UserGameData gameData = new UserGameData(
                1,
                "Team",
                new HashMap<>(),
                new HashMap<>(),
                new HashMap<>(),
                new ArrayList<>()
        );

        assertEquals(1, gameData.getChips().get(ChipNames.TRIPLE_CAPTAIN));
        assertEquals(1, gameData.getChips().get(ChipNames.BENCH_BOOST));
        assertFalse(gameData.getActiveChips().get(ChipNames.TRIPLE_CAPTAIN));
        assertFalse(gameData.getActiveChips().get(ChipNames.BENCH_BOOST));
    }

    @Test
    void cancellingAGameweekChipRestoresItsUse() {
        UserGameData gameData = new UserGameData("Team");

        gameData.useChip(ChipNames.TRIPLE_CAPTAIN);
        assertEquals(0, gameData.getChipCount(ChipNames.TRIPLE_CAPTAIN));
        assertTrue(gameData.getActiveChips().get(ChipNames.TRIPLE_CAPTAIN));

        gameData.deactivateChip(ChipNames.TRIPLE_CAPTAIN);
        assertEquals(1, gameData.getChipCount(ChipNames.TRIPLE_CAPTAIN));
        assertFalse(gameData.getActiveChips().get(ChipNames.TRIPLE_CAPTAIN));
    }

    @Test
    void firstPickCaptainMustBeCancelledBeforeMovingTheFirstPickToIr() {
        UserGameData gameData = new UserGameData("Team");
        Player firstPick = new Player(
                7,
                "First",
                "Pick",
                PlayerPosition.FORWARD,
                1,
                "First Pick"
        );
        Squad squad = new Squad();
        squad.setFirstPick(firstPick);
        gameData.setNextFantasyTeam(new FantasyTeam(1, squad));
        gameData.useChip(ChipNames.FIRST_PICK_CAPTAIN);

        IRException error = assertThrows(IRException.class, () -> gameData.useIrChipFor(firstPick));

        assertEquals(
                "Cancel First Pick Captain before moving the first-pick player to IR",
                error.getMessage()
        );
        assertEquals(2, gameData.getChipCount(ChipNames.IR));
        assertFalse(gameData.getActiveChips().get(ChipNames.IR));
        assertTrue(gameData.getActiveChips().get(ChipNames.FIRST_PICK_CAPTAIN));
    }
}
