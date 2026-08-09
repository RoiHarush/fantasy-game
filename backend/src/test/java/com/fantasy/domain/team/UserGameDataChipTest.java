package com.fantasy.domain.team;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
}
