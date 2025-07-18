package com.fantasy.PlayerTest;

import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.Player.PlayerState;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlayerTest {

    private Player player;
    private Team team;

    @BeforeEach
    void setUp() {
        team = new Team(TeamName.Liverpool.name());
        player = new Player("Mohamed", "Salah", PlayerPosition.MIDFIELDER, team);
    }

    @Test
    void testIdIsUniqueAndPositive() {
        Player other = new Player("John", "Doe", PlayerPosition.DEFENDER, team);
        assertNotEquals(player.getId(), other.getId());
        assertTrue(player.getId() > 0);
    }

    @Test
    void testGetNameCapitalization() {
        assertEquals("Mohamed Salah", player.getName());
    }

    @Test
    void testTeamAssignment() {
        assertEquals(team, player.getTeam());
        assertEquals("Liverpool", player.getTeam().getName());
    }

    @Test
    void testEqualsAndHashCode() {
        Player sameIdPlayer = new Player(player.getId(), "Other", "Name", PlayerPosition.MIDFIELDER, team);
        assertEquals(player, sameIdPlayer);
        assertEquals(player.hashCode(), sameIdPlayer.hashCode());

        Player differentPlayer = new Player("Different", "Player", PlayerPosition.DEFENDER, team);
        assertNotEquals(player, differentPlayer);
    }

    @Test
    void testCompareTo() {
        Player player2 = new Player("Another", "Guy", PlayerPosition.FORWARD, team);
        assertTrue(player.compareTo(player2) < 0 || player.compareTo(player2) > 0);
        assertEquals(0, player.compareTo(player));
    }

    @Test
    void testPointsPerGameWeek() {
        player.addPoints(1, 6);
        player.addPoints(1, 4);  // total should be 10
        player.addPoints(2, 3);

        assertEquals(10, player.getPointsForGameWeek(1));
        assertEquals(3, player.getPointsForGameWeek(2));
        assertEquals(0, player.getPointsForGameWeek(3));  // no points this week
    }

    @Test
    void testCaptainAndInjuryFlags() {
        assertFalse(player.isCaptain());
        assertFalse(player.isInjured());

        player.setCaptain(true);
        player.setInjured(true);

        assertTrue(player.isCaptain());
        assertTrue(player.isInjured());
    }

    @Test
    void testStateManagement() {
        assertEquals(PlayerState.NONE, player.getState());
        player.setState(PlayerState.STARTING);
        assertEquals(PlayerState.STARTING, player.getState());
    }

    @Test
    void testFirstPickFlag() {
        assertFalse(player.getFirstPick());
        player.setFirstPick(true);
        assertTrue(player.getFirstPick());
    }
}