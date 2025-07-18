package com.fantasy.FantasyTeamTest;

import com.fantasy.FantasyTeam.*;
import com.fantasy.FantasyTeam.Exceptions.*;
import com.fantasy.Player.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SquadTest {

    private Squad squad;
    private Player gk1, gk2, def1, def2, def3, def4, def5;
    private Player mid1, mid2, mid3, mid4, mid5;
    private Player fwd1, fwd2, fwd3;

    @BeforeEach
    void setUp() {
        squad = new Squad();

        gk1 = new Player("Sim", "Gk1", PlayerPosition.GOALKEEPER, null);
        gk2 = new Player("Sim", "Gk2", PlayerPosition.GOALKEEPER, null);

        def1 = new Player("Sim", "Def1", PlayerPosition.DEFENDER, null);
        def2 = new Player("Sim", "Def2", PlayerPosition.DEFENDER, null);
        def3 = new Player("Sim", "Def3", PlayerPosition.DEFENDER, null);
        def4 = new Player("Sim", "Def4", PlayerPosition.DEFENDER, null);
        def5 = new Player("Sim", "Def5", PlayerPosition.DEFENDER, null);

        mid1 = new Player("Sim", "Mid1", PlayerPosition.MIDFIELDER, null);
        mid2 = new Player("Sim", "Mid2", PlayerPosition.MIDFIELDER, null);
        mid3 = new Player("Sim", "Mid3", PlayerPosition.MIDFIELDER, null);
        mid4 = new Player("Sim", "Mid4", PlayerPosition.MIDFIELDER, null);
        mid5 = new Player("Sim", "Mid5", PlayerPosition.MIDFIELDER, null);

        fwd1 = new Player("Sim", "Fwd1", PlayerPosition.FORWARD, null);
        fwd2 = new Player("Sim", "Fwd2", PlayerPosition.FORWARD, null);
        fwd3 = new Player("Sim", "Fwd3", PlayerPosition.FORWARD, null);
    }

    void makeFullPick() {
        squad.makePick(gk1);
        squad.makePick(gk2);

        squad.makePick(def1);
        squad.makePick(def2);
        squad.makePick(def3);
        squad.makePick(def4);
        squad.makePick(def5);

        squad.makePick(mid1);
        squad.makePick(mid2);
        squad.makePick(mid3);
        squad.makePick(mid4);
        squad.makePick(mid5);

        squad.makePick(fwd1);
        squad.makePick(fwd2);
        squad.makePick(fwd3);
    }

    @Test
    void testInitialLineupBuildsCorrectly() {
        makeFullPick();

        assertEquals(11, squad.getStartingLineup().size());
        assertEquals(4, squad.getBench().size());
        assertTrue(squad.isInitialLineup());
    }

    @Test
    void testMakePickOver15ThrowsException() {
        makeFullPick();
        Player extra = new Player("Extra", "Player", PlayerPosition.MIDFIELDER, null);

        assertThrows(MaxPicksUsagesException.class, () -> squad.makePick(extra));
    }

    @Test
    void testFirstPickSetsFirstPickFlag() {
        squad.makePick(mid1);
        assertTrue(mid1.getFirstPick());
    }

    @Test
    void testAssignCaptainWithFirstPickThrows() {
        squad.makePick(mid1);

        assertThrows(InvalidCapitanPlayerException.class, () -> squad.assignCaptain(mid1));
    }

    @Test
    void testAssignCaptainLegal() {
        makeFullPick();

        Player legalCaptain = squad.getStartingLineup().get(1);
        squad.assignCaptain(legalCaptain);
        assertTrue(legalCaptain.isCaptain());
    }

    @Test
    void testSwitchPlayersSuccess() {
        makeFullPick();

        Player starter = squad.getStartingLineupReop().getPlayersByPosition(PlayerPosition.MIDFIELDER).get(0);
        Player bencher = squad.getBenchRepo().getPlayersByPosition(PlayerPosition.MIDFIELDER).get(0);

        squad.switchPlayers(starter, bencher);

        assertEquals(PlayerState.BENCH, starter.getState());
        assertEquals(PlayerState.STARTING, bencher.getState());
    }

    @Test
    void testInvalidFormationThrows() {
        makeFullPick();

        Player starter = squad.getStartingLineupReop().getPlayersByPosition(PlayerPosition.GOALKEEPER).get(0);
        Player bencher = squad.getBenchRepo().getPlayersByPosition(PlayerPosition.DEFENDER).get(0);

        assertThrows(InvalidFormationException.class, () -> squad.switchPlayers(starter, bencher));
    }

    @Test
    void testMakeTransferWithDifferentPositionsThrows() {
        makeFullPick();

        Player starter = squad.getStartingLineupReop().getPlayersByPosition(PlayerPosition.DEFENDER).get(0);
        Player outsider = new Player("Out", "Side", PlayerPosition.MIDFIELDER, null);

        assertThrows(InvalidTransferPlayersException.class, () -> squad.makeTransfer(outsider, starter));
    }

    @Test
    void testMakeTransferSuccess() {
        makeFullPick();

        Player starter = squad.getStartingLineupReop().getPlayersByPosition(PlayerPosition.FORWARD).get(0);
        Player newPlayer = new Player("New", "Fwd", PlayerPosition.FORWARD, null);

        squad.makeTransfer(newPlayer, starter);
        assertEquals(PlayerState.STARTING, newPlayer.getState());
        assertFalse(starter.getFirstPick());
    }


}

