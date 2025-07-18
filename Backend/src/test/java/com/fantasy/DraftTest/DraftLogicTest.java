package com.fantasy.DraftTest;

import com.fantasy.Draft.DraftLogic;
import com.fantasy.Draft.DraftRoom;
import com.fantasy.Draft.Exceptions.NotAvailablePlayerException;
import com.fantasy.Draft.Exceptions.NotOwnPlayerException;
import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.Player.*;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;
import com.fantasy.User.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DraftLogicTest {

    private DraftRoom room;
    private FantasyTeam team;
    private User user;
    private PlayerRepository poll;
    private Player player1;
    private Player player2;
    private Player playerOut;

    @BeforeEach
    void setUp() {
        room = new DraftRoom();
        poll = new PlayerRepository();
        Team realTeam = new Team(TeamName.Liverpool.name());
        team = new FantasyTeam("Test FC");
        user = new User("TestUser", "tu", "1111111");
        room.startDraft(java.util.List.of(user), poll);

        // כל השחקנים מאותה העמדה
        player1 = new Player("Mo", "Salah", PlayerPosition.MIDFIELDER, realTeam);
        player2 = new Player("Kevin", "DeBruyne", PlayerPosition.MIDFIELDER, realTeam);
        playerOut = new Player("Bruno", "Fernandes", PlayerPosition.MIDFIELDER, realTeam);

        poll.loadOne(player1);
        poll.loadOne(player2);
        poll.loadOne(playerOut);
        user.setFantasyTeam(team);
    }

    @Test
    void testFirstPicksSuccess() {
        DraftLogic.firstPicks(room, user, player1);

        assertFalse(poll.getPlayers().contains(player1));
        assertTrue(team.playerContain(player1));
        assertEquals(PlayerState.IN_USE, player1.getState());
    }

    @Test
    void testFirstPicksThrowsNotAvailablePlayer() {
        // הסר מהפול כדי לדמות שחקן לא זמין
        poll.removePlayer(player1);
        assertThrows(NotAvailablePlayerException.class,
                () -> DraftLogic.firstPicks(room, user, player1));
    }

    @Test
    void testMakeTransferSuccess() {
        team.makePick(playerOut); // מוסיף את playerOut לקבוצה
        poll.loadOne(playerOut); // מחזיר אותו גם לפול
        team.getSquad().loadPlayer(playerOut); // לוודא שנמצא בכל המקומות

        DraftLogic.makeTransfer(room, user, player2, playerOut);

        assertTrue(team.playerContain(player2));
        assertTrue(poll.getPlayers().contains(playerOut));
    }

    @Test
    void testMakeTransferThrowsNotAvailablePlayer() {
        poll.removePlayer(player2);
        team.makePick(playerOut);
        team.getSquad().loadPlayer(playerOut);

        assertThrows(NotAvailablePlayerException.class,
                () -> DraftLogic.makeTransfer(room, user, player2, playerOut));
    }

    @Test
    void testMakeTransferThrowsNotOwnPlayer() {
        poll.loadOne(player2);
        // intentionally not adding playerOut to the fantasyTeam

        assertThrows(NotOwnPlayerException.class,
                () -> DraftLogic.makeTransfer(room, user, player2, playerOut));
    }
}



