package com.fantasy.FantasyTeam;

import com.fantasy.FantasyTeam.Exceptions.*;
import com.fantasy.Intefaces.Draftable;
import com.fantasy.Intefaces.ITeam;
import com.fantasy.Player.*;

import java.util.*;

public class Squad implements Draftable {
    private PlayerRepository allPlayers;
    private PlayerRepository startingLineup;
    private PlayerRepository bench;
    private Player captain;
    private Player viceCaptain;
    private Player IR = null;
    private boolean initialLineup;
    private final Map<PlayerPosition,Integer> minPlayersInPosition = new HashMap<>();
    private final Map<PlayerPosition,Integer> maxPlayersInPosition = new HashMap<>();

    public Squad(){
        setAllPlayers();
        setStartingLineup();
        setBench();
        setMinPlayersInPosition();
        setMaxPlayersInPosition();
    }

    // <editor-fold desc="Getters and Setters">

    public List<Player> getAllPlayers() {
        return allPlayers.getPlayers();
    }

    public void setAllPlayers() {
        this.allPlayers = new PlayerRepository();
    }

    public List<Player> getStartingLineup() {
        return startingLineup.getPlayers();
    }

    public PlayerRepository getStartingLineupReop() {
        return startingLineup;
    }

    public void setStartingLineup() {
        this.startingLineup = new PlayerRepository();
    }

    public PlayerRepository getBenchRepo() {
        return bench;
    }

    public List<Player> getBench() {
        return bench.getPlayers();
    }

    public void setBench() {
        this.bench = new PlayerRepository();
    }

    public boolean isInitialLineup() {
        return initialLineup;
    }

    public void setInitialLineup(boolean initialLineup) {
        this.initialLineup = initialLineup;
    }

    public void setMinPlayersInPosition(){
        this.minPlayersInPosition.put(PlayerPosition.GOALKEEPER, 1);
        this.minPlayersInPosition.put(PlayerPosition.DEFENDER, 3);
        this.minPlayersInPosition.put(PlayerPosition.MIDFIELDER, 3);
        this.minPlayersInPosition.put(PlayerPosition.FORWARD, 1);
    }
    public void setMaxPlayersInPosition(){
        this.maxPlayersInPosition.put(PlayerPosition.GOALKEEPER, 2);
        this.maxPlayersInPosition.put(PlayerPosition.DEFENDER, 5);
        this.maxPlayersInPosition.put(PlayerPosition.MIDFIELDER, 5);
        this.maxPlayersInPosition.put(PlayerPosition.FORWARD, 3);
    }
    // </editor-fold>

    public Player getPlayerById(int id){
        return this.allPlayers.getById(id);
    }

    public List<Player> getPlayersByTeam(ITeam team){
        return this.allPlayers.getPlayersByTeam(team);
    }

    public void loadPlayer(Player player){
        this.allPlayers.loadOne(player);
    }

    @Override
    public String toString() {
        return "Starting 11:\n" + this.startingLineup +
                "\n\n" + "Bench:\n" + this.bench;
    }

    public void makePick(Player player){
        if (this.allPlayers.getPlayers().size() >= 15)
            throw new MaxPicksUsagesException("Cant make over 15 picks!");
        if (this.allPlayers.getById(player.getId()) != null)
            throw new PlayerAlreadyPickedException("Player already picked in this squad!");
        List<Player> playersByPosition = this.allPlayers.getPlayersByPosition(player.getPosition());
        if (playersByPosition != null && (playersByPosition.size() >= this.maxPlayersInPosition.get(player.getPosition())))
            throw new MaxPositionCapacityException("Cant pick more players from this position: " + player.getPosition());
        this.allPlayers.loadOne(player);
        if (this.allPlayers.getPlayers().size() == 1)
            player.setFirstPick(true);
        if (this.allPlayers.getPlayers().size() == 15)
            buildInitialLineup();
    }

    public void buildInitialLineup(){
        if (!this.initialLineup) {
            setFirstLineup();
            setFirstBench();
            setInitialLineup(true);
            assignCaptain(this.startingLineup.getPlayers().get(1));
            assignViceCaptain(this.startingLineup.getPlayers().get(2));
        }
    }

    public void setFirstLineup() {
        int num = 0;
        for (PlayerPosition positon : PlayerPosition.values()) {
            switch (positon) {
                case GOALKEEPER:
                    num = 1;
                    break;
                case DEFENDER:
                    num = 4;
                    break;
                case MIDFIELDER:
                    num = 4;
                    break;
                case FORWARD:
                    num = 2;
                    break;
            }
            List<Player> players = this.allPlayers.getPlayersByPosition(positon);
            if (players.size() < num)
                throw new NotEnoughPlayersInPositionException("Not enough players in position: " + positon);
            makeFirstLineup(players, num);
        }
    }

    public void makeFirstLineup(List<Player> source, int num){
        for (int i = 0; i < num && i < source.size(); i++) {
            this.startingLineup.loadOne(source.get(i));
            source.get(i).setState(PlayerState.STARTING);
        }
    }

    public void setFirstBench(){
        for (Player player : this.allPlayers.getPlayers()){
            if (player.getState() == PlayerState.NONE || player.getState() == PlayerState.IN_USE){
                this.bench.loadOne(player);
                player.setState(PlayerState.BENCH);
            }
        }
    }

    public void makeTransfer(Player playerIn, Player playerOut){
        if (!isPlayersAreTheSamePositions(playerIn, playerOut))
            throw new InvalidTransferPlayersException("Cant Transfer players that are in different Positions!");
        this.allPlayers.transferPlayers(playerIn,playerOut);
        switch (playerOut.getState()){
            case STARTING:
                this.startingLineup.transferPlayers(playerIn,playerOut);
                playerIn.setState(PlayerState.STARTING);
                break;
            case BENCH:
                this.bench.transferPlayers(playerIn,playerOut);
                playerIn.setState(PlayerState.BENCH);
                break;
            default:
                playerIn.setState(PlayerState.IN_USE);
        }
        playerOut.setState(PlayerState.NONE);
        playerOut.setFirstPick(false);
    }

    public boolean isPlayersAreTheSamePositions(Player p1, Player p2){
        return p1.getPosition() == p2.getPosition();
    }

    public boolean isValidFormation(Player lineupPlayer, Player benchPlayer){
        if (isPlayersAreTheSamePositions(lineupPlayer, benchPlayer))
            return true;
        PlayerPosition lineupPlayerPosition = lineupPlayer.getPosition();
        int minNumOfPlayers = this.minPlayersInPosition.get(lineupPlayerPosition);
        int numOfPlayers = this.startingLineup.getPlayersByPosition(lineupPlayerPosition).size();
        return numOfPlayers - 1 >= minNumOfPlayers;
    }

    public void switchPlayers(Player lineupPlayer, Player benchPlayer) {
        ensurePlayersInSquad(lineupPlayer, benchPlayer);
        if (!isValidFormation(lineupPlayer, benchPlayer))
            throw new InvalidFormationException("Cannot switch these players --> wrong formation!");
        this.startingLineup.removePlayer(lineupPlayer);
        this.bench.removePlayer(benchPlayer);
        this.startingLineup.loadOne(benchPlayer);
        this.bench.loadOne(lineupPlayer);
        lineupPlayer.setState((PlayerState.BENCH));
        benchPlayer.setState(PlayerState.STARTING);
    }

    public void assignCaptain(Player captain) {
        ensurePlayersInSquad(captain);
        if (captain.getFirstPick())
            throw new InvalidCapitanPlayerException("This player cant be a captain because: It was first makePick at this squad");
        this.captain = captain;
        captain.setCaptain(true);
    }

    public void assignViceCaptain(Player viceCaptain) {
        ensurePlayersInSquad(viceCaptain);
        if (viceCaptain.getFirstPick())
            throw new InvalidCapitanPlayerException("This player cant be a captain because: It was first makePick at this squad");
        this.viceCaptain = viceCaptain;
    }

    private void ensurePlayersInSquad(Player... players) {
        for (Player player : players) {
            if (this.allPlayers.getById(player.getId()) == null) {
                throw new CantFindPlayerInSquadException("Player not in the squad!");
            }
        }
    }
}
