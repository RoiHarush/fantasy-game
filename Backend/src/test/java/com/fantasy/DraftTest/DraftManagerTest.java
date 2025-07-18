package com.fantasy.DraftTest;

import com.fantasy.Draft.DraftManager;
import com.fantasy.Draft.DraftRoom;
import com.fantasy.Draft.Exceptions.NotUserTurnException;
import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.Intefaces.IFantasyTeam;
import com.fantasy.Intefaces.ITeam;
import com.fantasy.Player.*;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;
import com.fantasy.User.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

public class DraftManagerTest {
    DraftManager manager;
    DraftRoom initialRoom;
    DraftRoom weeklyRoom;
    User user;
    List<User> users;
    Player playerIn;
    Player playerOut;
    PlayerRepository poll;
    IFantasyTeam fantasyTeam;
    ITeam team;

    @BeforeEach
    void setUp(){
        DraftRoom.resetRoomNumberGenerator();
        initialRoom = new DraftRoom();
        weeklyRoom = new DraftRoom();
        manager = new DraftManager();
        user = new User("Test User", "testU", "1111");
        fantasyTeam = new FantasyTeam("Test Fantasy Team");
        team = new Team(TeamName.Liverpool.name());
        playerIn = new Player("Test Player", "1", PlayerPosition.MIDFIELDER, team);
        playerOut = new Player("Test Player", "2", PlayerPosition.MIDFIELDER, team);
        poll = new PlayerRepository();
        users = new ArrayList<>();

        user.setFantasyTeam(fantasyTeam);
        poll.loadOne(playerIn);
        poll.loadOne(playerOut);
        users.add(user);
        manager.startDraft(initialRoom,users, poll);

    }

    @Test
    void StartDraftSuccussTest(){
        assertTrue(initialRoom.isActive());
    }

    @Test
    void makePickThrowsNotUserTurnTest(){
        User notTurnUser = new User("Its not my turn", "testU", "1111");
        assertThrows(NotUserTurnException.class,
                () -> manager.makePick(initialRoom, notTurnUser, playerIn, null));
    }

    @Test
    void makePickInitialPick(){
        manager.makePick(initialRoom, user, playerIn, playerOut);

        assertFalse(poll.getPlayers().contains(playerIn));
        assertTrue(fantasyTeam.playerContain(playerIn));
        assertEquals(PlayerState.IN_USE, playerIn.getState());
    }

    @Test
    void makePickWeeklyPick(){
        manager.startDraft(weeklyRoom,users, poll);
        fantasyTeam.getSquad().loadPlayer(playerOut);
        manager.makePick(weeklyRoom, user, playerIn, playerOut);

        assertFalse(poll.getPlayers().contains(playerIn));
        assertTrue(fantasyTeam.playerContain(playerIn));
        assertEquals(PlayerState.IN_USE, playerIn.getState());

        assertTrue(poll.getPlayers().contains(playerOut));
        assertFalse(fantasyTeam.playerContain(playerOut));
        assertEquals(PlayerState.NONE, playerOut.getState());
    }

    @Test
    void getCurrentUserReturnsCorrectUser() {
        assertEquals(user, manager.getCurrentUser(initialRoom));
    }

    @Test
    void getAvailablePlayersReturnsCorrectList() {
        List<Player> available = manager.getAvailablePlayers(initialRoom);
        assertTrue(available.contains(playerIn));
        assertTrue(available.contains(playerOut));
    }

    @Test
    void makePickWithMultipleUsers_advancesTurnCorrectly() {
        User secondUser = new User("Second User", "u2", "2222");
        IFantasyTeam secondFantasyTeam = new FantasyTeam("Team 2");
        secondUser.setFantasyTeam(secondFantasyTeam);
        users.add(secondUser);

        manager.startDraft(initialRoom, users, poll);

        manager.makePick(initialRoom, user, playerIn, null);

        assertEquals(secondUser, manager.getCurrentUser(initialRoom));
    }

}
