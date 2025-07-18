package com.fantasy.Main;

import com.fantasy.Draft.DraftManager;
import com.fantasy.Draft.DraftRoom;
import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.Intefaces.IFantasyTeam;
import com.fantasy.Intefaces.ITeam;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.Player.PlayerRepository;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;
import com.fantasy.User.User;

import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) throws Exception {
//        List<Player> players = FplPlayerGenerator.fetchAllFplPlayers();
//        players.stream().limit(10).forEach(p -> System.out.println(p.getName() + " - " + p.getPosition() + " - " + p.getTeam().getName()));
        makePickWithMultipleUsers_advancesTurnCorrectly();
    }

    static void makePickWithMultipleUsers_advancesTurnCorrectly() {
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

        manager = new DraftManager();
        initialRoom = new DraftRoom();
        weeklyRoom = new DraftRoom();
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

        User secondUser = new User("Second User", "u2", "2222");
        IFantasyTeam secondFantasyTeam = new FantasyTeam("Team 2");
        secondUser.setFantasyTeam(secondFantasyTeam);
        users.add(secondUser);

        manager.startDraft(initialRoom, users, poll);

        manager.makePick(initialRoom, user, playerIn, null);

        //assertEquals(secondUser, manager.getCurrentUser(initialRoom));
    }
}
