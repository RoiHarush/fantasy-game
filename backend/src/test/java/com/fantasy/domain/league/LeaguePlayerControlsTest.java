package com.fantasy.domain.league;

import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LeaguePlayerControlsTest {

    @Test
    void keepsPositionLocksAndScoreCorrectionsIsolatedPerLeague() {
        PlayerEntity player = new PlayerEntity();
        player.setId(15);
        player.setPosition(PlayerPosition.MIDFIELDER);

        LeagueEntity firstLeague = new LeagueEntity();
        LeagueEntity secondLeague = new LeagueEntity();

        firstLeague.setPlayerPosition(player, PlayerPosition.FORWARD);
        firstLeague.setPlayerLocked(player.getId(), true);
        assertEquals(2, firstLeague.adjustAssists(player.getId(), 4, 1, 1));
        assertEquals(2, firstLeague.adjustPenaltiesConceded(player.getId(), 4, 1, 1));

        assertEquals(PlayerPosition.FORWARD, firstLeague.effectivePosition(player));
        assertTrue(firstLeague.isPlayerLocked(player.getId()));
        assertEquals(2, firstLeague.effectiveAssists(player.getId(), 4, 1));
        assertEquals(2, firstLeague.effectivePenaltiesConceded(player.getId(), 4, 1));

        assertEquals(PlayerPosition.MIDFIELDER, secondLeague.effectivePosition(player));
        assertFalse(secondLeague.isPlayerLocked(player.getId()));
        assertEquals(1, secondLeague.effectiveAssists(player.getId(), 4, 1));
        assertEquals(1, secondLeague.effectivePenaltiesConceded(player.getId(), 4, 1));
    }
}
