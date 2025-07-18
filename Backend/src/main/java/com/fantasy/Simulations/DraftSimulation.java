package com.fantasy.Simulations;


import com.fantasy.Draft.DraftManager;
import com.fantasy.Draft.DraftRoom;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerRepository;
import com.fantasy.Simulations.Utils.FplPlayerGenerator;
import com.fantasy.Simulations.Utils.TestUserFactory;
import com.fantasy.User.User;

import java.util.*;

public class DraftSimulation {

    static Scanner scanner = new Scanner(System.in);
    static Random rnd = new Random();

    public static void main(String[] args) {
        List<User> users = TestUserFactory.generateUsers(7);
        users.forEach(user -> System.out.println(user + " - " + user.getFantasyTeam()));
        try {
            draft();
        }catch (Exception e){
            System.out.println(e.getMessage());
        }

    }

    public static void draft()throws Exception{
        List<User> users = TestUserFactory.generateUsers(7);
        PlayerRepository allPlayers = new PlayerRepository();
        allPlayers.loadMany(FplPlayerGenerator.fetchAllFplPlayers());
        PlayerRepository playersPoll = new PlayerRepository();
        playersPoll.loadMany(FplPlayerGenerator.fetchAllFplPlayers());
        DraftRoom room = new DraftRoom();
        DraftManager manager = new DraftManager();
        manageDraft(room, manager, users, playersPoll);
        printTeams(users);
        validateTeams(users);
    }

    public static void manageDraft(DraftRoom room, DraftManager manager, List<User> users, PlayerRepository playersPoll){
        Player player;
        User user;
        List<Player> availablePlayers;
        System.out.println("==GAME WEEK: " + room.getRoomNumber() + "==");
        List<User> draftUsers = new ArrayList<>(users);
        manager.startDraft(room, draftUsers, playersPoll);
        while (!room.isDraftOver()){
            user = manager.getCurrentUser(room);
            availablePlayers = manager.getAvailablePlayers(room);
            player = findLegalPick(user, availablePlayers, room, manager);
            if (player == null){
                //System.out.println("No legal picks found for user: " + user.getName());
                room.advanceTurn();
                continue;
            }
            //System.out.println("Now its: " + user + " turn:");
            //System.out.println(user + " picks --> " + player);
        }
    }

    public static Player findLegalPick(User user, List<Player> candidates, DraftRoom room, DraftManager manager) {
        List<Player> shuffled = new ArrayList<>(candidates);
        Collections.shuffle(shuffled);
        for (Player p : shuffled) {
            try {
                manager.makePick(room, user, p, null);
                return p;
            }catch (Exception e) {
                //
            }
        }
        return null;
    }



    public static void printTeams(List<User> users){
        for (User user : users) {
            System.out.println("== User: " + user.getName() + " ==");
//            printSquad(user.getFantasyTeam().getSquad().getAllPlayers(), "All Tean:");
            printSquad(user.getFantasyTeam().getSquad().getStartingLineup(), "Starting 11: ");
            printSquad(user.getFantasyTeam().getSquad().getBench(), "Bench: ");
            System.out.println("Total: " + user.getFantasyTeam().getSquad().getAllPlayers().size() +
                    " | Starting: " + user.getFantasyTeam().getSquad().getStartingLineup().size() +
                    " | Bench: " + user.getFantasyTeam().getSquad().getBench().size());

            System.out.println();
        }
    }

    public static void printSquad(List<Player> players, String message){
        System.out.println(message);
        for (Player player : players){
            System.out.println("- " + player + '(' + player.getPosition().getCode() + ", " + player.getTeam().getName() + ')');
        }
    }

    public static void validateTeams(List<User> users){
        for (User user : users){
            int totalPlayers = user.getFantasyTeam().getSquad().getAllPlayers().size();
            System.out.println(user.getName() + " total players: " + totalPlayers);
            if (totalPlayers != 15){
                System.out.println("❌ ERROR: User " + user.getName() + " has " + totalPlayers + " players!");
            }
        }
    }


    public static void testDraft(DraftRoom room, DraftManager manager, List<User> users, PlayerRepository playersPoll){
        int draftActive = 1;
        Player player;
        User user;
        List<Player> availablePlayers;
        System.out.println("==GAME WEEK: " + room.getRoomNumber() + "==");
        Collections.shuffle(users);
        manager.startDraft(room, users, playersPoll);
        while (draftActive == 1){
            user = manager.getCurrentUser(room);
            availablePlayers = manager.getAvailablePlayers(room);
            player = availablePlayers.get(rnd.nextInt(0,availablePlayers.size()));
            System.out.println("Now its: " + user + " turn:");
            try {
                manager.makePick(room, user, player, null);
                System.out.println(user + " picks --> " + player);
            }catch (Exception e){
                System.out.println("Exception! " + e.getMessage());
            }
            System.out.print("Shall we continue? ");
            draftActive = scanner.nextInt();
            scanner.nextLine();
        }
    }
}
