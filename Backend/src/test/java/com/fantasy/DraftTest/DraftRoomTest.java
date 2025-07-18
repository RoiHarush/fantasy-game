package com.fantasy.DraftTest;

import com.fantasy.Draft.DraftRoom;
import com.fantasy.Player.*;
import com.fantasy.RealWorldData.Team;
import com.fantasy.User.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DraftRoomTest {

    private DraftRoom room;
    private PlayerRepository repository;
    private List<User> users;
    private Player player1;
    private Player player2;
    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        room = new DraftRoom();
        repository = new PlayerRepository();
        users = new ArrayList<>();

        // Simple mock players and users
        Team dummyTeam = new Team("Arsenal");
        player1 = new Player("John", "Doe", PlayerPosition.MIDFIELDER, dummyTeam);
        player2 = new Player("Jane", "Smith", PlayerPosition.DEFENDER, dummyTeam);

        repository.loadOne(player1);
        repository.loadOne(player2);

        user1 = new User("Omri Zidon", "eden", "pass");
        user2 = new User("Roi Harush", "roi", "pass");


        users.add(user1);
        users.add(user2);

        room.startDraft(users, repository);
    }

    @Test
    void testStartDraftInitializesStateCorrectly() {
        assertTrue(room.isActive());
        assertEquals(user1, room.getCurrentUser());
        assertEquals(2, room.getParticipants().size());
        assertNotNull(room.getPlayersPoll());
        assertNotNull(room.getStartAt());
        assertNotNull(room.getEndAt());
        assertEquals(2, room.getTurnHistory().size());
    }

    @Test
    void testAdvanceTurnForwardAndBackwards() {
        assertEquals(user1, room.getCurrentUser());
        room.advanceTurn();
        assertEquals(user2, room.getCurrentUser());
        room.advanceTurn(); // reverse direction
        assertEquals(user2, room.getCurrentUser()); // should stay and flip direction
        room.advanceTurn();
        assertEquals(user1, room.getCurrentUser()); // now goes back
    }

    @Test
    void testIsUsersTurn() {
        assertTrue(room.isUsersTurn(user1));
        assertFalse(room.isUsersTurn(user2));
    }

    @Test
    void testIsPlayerAvailable() {
        assertTrue(room.isPlayerAvailable(player1));
        room.removePlayerFromPlayersPoll(player1);
        assertFalse(room.isPlayerAvailable(player1));
    }

    @Test
    void testRemoveAndAddPlayerFromPoll() {
        room.removePlayerFromPlayersPoll(player2);
        assertFalse(room.isPlayerAvailable(player2));
        room.addPlayerToPlayersPoll(player2);
        assertTrue(room.isPlayerAvailable(player2));
    }

    @Test
    void testUpdateTurnHistory() {
        room.updateTurnHistory(user1, player1);
        List<Player> picks = room.getTurnHistory().get(user1);
        assertEquals(1, picks.size());
        assertEquals(player1, picks.get(0));
    }
}
