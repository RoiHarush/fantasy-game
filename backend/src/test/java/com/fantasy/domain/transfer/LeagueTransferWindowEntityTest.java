package com.fantasy.domain.transfer;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LeagueTransferWindowEntityTest {

    @Test
    void restoresCurrentTurnEntirelyFromPersistedCursorsAndOrders() {
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setTurnOrder(List.of(1, 2, 2, 1));
        window.open(List.of(2));

        assertEquals(1, window.currentUserId().orElseThrow());
        assertEquals(List.of(1, 2), window.initialOrder());
        assertEquals(2, window.totalTurns().get(1));

        window.advanceTurn();
        assertEquals(2, window.currentUserId().orElseThrow());
        assertEquals(1, window.turnsUsed().get(1));

        window.advanceTurn();
        window.advanceTurn();
        window.advanceTurn();
        assertEquals(TransferWindowPhase.IR, window.getPhase());
        assertEquals(2, window.currentUserId().orElseThrow());

        window.advanceTurn();
        assertEquals(TransferWindowStatus.CLOSED, window.getStatus());
        assertFalse(window.currentUserId().isPresent());
    }

    @Test
    void refusesToOpenWithoutAConfiguredOrder() {
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> window.open(List.of())
        );

        assertTrue(error.getMessage().contains("order"));
    }
}
