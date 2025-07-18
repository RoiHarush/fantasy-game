package com.fantasy.Integration;

import com.fantasy.Draft.DraftManager;
import com.fantasy.Draft.DraftRoom;
import com.fantasy.FantasyTeam.Exceptions.MaxPicksUsagesException;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerRepository;
import com.fantasy.Simulations.Utils.FplPlayerGenerator;
import com.fantasy.Simulations.Utils.TestUserFactory;
import com.fantasy.User.User;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class DraftSimulationTest {

    @Test
    void testDraftCompletesSuccessfullyForAllUsers() throws Exception {
        List<User> users = TestUserFactory.generateUsers(7);
        PlayerRepository playersPoll = new PlayerRepository();
        playersPoll.loadMany(FplPlayerGenerator.fetchAllFplPlayers());

        DraftRoom room = new DraftRoom();
        DraftManager manager = new DraftManager();

        runDraft(room, manager, users, playersPoll);

        assertTrue(room.isDraftOver(), "Draft should be marked as over");

        for (User user : users) {
            int totalPlayers = user.getFantasyTeam().getSquad().getAllPlayers().size();
            assertEquals(15, totalPlayers, "Each user should have exactly 15 players");

            int starting = user.getFantasyTeam().getSquad().getStartingLineup().size();
            int bench = user.getFantasyTeam().getSquad().getBench().size();
            assertEquals(11, starting, "Each user should have exactly 11 players in starting lineup");
            assertEquals(4, bench, "Each user should have exactly 4 players on the bench");
        }
    }

    private void runDraft(DraftRoom room, DraftManager manager, List<User> users, PlayerRepository playersPoll) {
        Player player;
        User user;
        List<Player> availablePlayers;
        List<User> draftUsers = new ArrayList<>(users);
        manager.startDraft(room, draftUsers, playersPoll);

        while (!room.isDraftOver()) {
            user = manager.getCurrentUser(room);
            availablePlayers = manager.getAvailablePlayers(room);
            player = findLegalPick(user, availablePlayers, room, manager);
            if (player == null) {
                draftUsers.remove(user);
            }
        }
    }

    private Player findLegalPick(User user, List<Player> candidates, DraftRoom room, DraftManager manager) {
        List<Player> shuffled = new ArrayList<>(candidates);
        Collections.shuffle(shuffled);
        for (Player p : shuffled) {
            try {
                manager.makePick(room, user, p, null);
                return p;
            } catch (MaxPicksUsagesException e) {
                return null;
            } catch (Exception e){
                //
            }
        }
        return null;
    }
}

