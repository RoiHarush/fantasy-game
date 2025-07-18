package com.fantasy.Player;

import com.fantasy.Intefaces.ITeam;
import com.fantasy.Intefaces.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
//TODO: Add exceptions
public class PlayerRepository implements Repository<Player> {
    private final List<Player> players;
    private final Map<Integer, Player> playersById;
    private final Map<ITeam, List<Player>> playersByTeam;
    private final Map<PlayerPosition, List<Player>> playersByPosition;

    public PlayerRepository(){
        this.players = new ArrayList<>();
        this.playersById = new HashMap<>();
        this.playersByTeam = new HashMap<>();
        this.playersByPosition = new HashMap<>();
    }

    public void loadMany(List<Player> players){
        for (Player player : players)
            loadOne(player);
    }

    public void loadOne(Player player){
        this.playersById.put(player.getId(), player);
        this.playersByTeam.computeIfAbsent(player.getTeam(),k -> new ArrayList<>()).add(player);
        this.playersByPosition.computeIfAbsent(player.getPosition(), k -> new ArrayList<>()).add(player);
        this.players.add(player);
    }

    public void removePlayer(Player player){
        this.playersById.remove(player.getId());
        this.playersByTeam.get(player.getTeam()).remove(player);
        this.playersByPosition.get(player.getPosition()).remove(player);
        this.players.remove(player);
    }

    public Player getById(int id){
        return playersById.get(id);
    }

    public List<Player> getPlayersByTeam(ITeam team){
        return playersByTeam.get(team);
    }

    public List<Player> getPlayersByPosition(PlayerPosition position){
        return playersByPosition.get(position);
    }

    public List<Player> getPlayers(){
        return this.players;
    }

    public void transferPlayers(Player playerIn, Player playerOut){
        if (playerIn == null || playerOut == null)
            throw new NullPointerException();
        //Make Transfer
        int playerIndex = this.players.indexOf(playerOut);
        this.players.set(playerIndex, playerIn);
        //Make transfer by ID
        this.playersById.remove(playerOut.getId());
        this.playersById.put(playerIn.getId(), playerIn);
        //Make transfer by team
        this.playersByTeam.get(playerOut.getTeam()).remove(playerOut);
        this.playersByTeam.get(playerIn.getTeam()).add(playerIn);
        //Make transfer by position
        PlayerPosition position = playerIn.getPosition();
        playerIndex = this.playersByPosition.get(position).indexOf(playerOut);
        this.playersByPosition.get(position).set(playerIndex,playerIn);
    }

    @Override
    public String toString(){
        return this.players.toString();
    }
}
