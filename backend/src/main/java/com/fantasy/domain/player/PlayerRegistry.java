package com.fantasy.domain.player;

import com.fantasy.domain.intefaces.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

//TODO: Add exceptions
public class PlayerRegistry implements Repository<Player> {
    private final List<Player> players;
    private final Map<Integer, Player> playersById;
    private final Map<Integer, List<Player>> playersByTeam;
    private final Map<PlayerPosition, List<Player>> playersByPosition;

    public PlayerRegistry(){
        this.players = new ArrayList<>();
        this.playersById = new HashMap<>();
        this.playersByTeam = new HashMap<>();
        this.playersByPosition = new HashMap<>();
    }

    public boolean isEmpty(){
        return players.isEmpty() && playersById.isEmpty() && playersByTeam.isEmpty() && playersByPosition.isEmpty();
    }

    public void loadMany(List<Player> players){
        for (Player player : players)
            loadOne(player);
    }

    public void loadOne(Player player){
        this.playersById.put(player.getId(), player);
        this.playersByTeam.computeIfAbsent(player.getTeamId(), k -> new ArrayList<>()).add(player);
        this.playersByPosition.computeIfAbsent(player.getPosition(), k -> new ArrayList<>()).add(player);
        this.players.add(player);
    }

    public void removePlayer(Player player) {
        if (player == null) return;

        players.removeIf(p -> p.getId() == player.getId());

        playersById.remove(player.getId());

        List<Player> teamList = playersByTeam.get(player.getTeamId());
        if (teamList != null) {
            teamList.removeIf(p -> p.getId() == player.getId());
        }

        List<Player> posList = playersByPosition.get(player.getPosition());
        if (posList != null) {
            posList.removeIf(p -> p.getId() == player.getId());
        }
    }


    public Player getById(int id){
        return playersById.get(id);
    }

    public List<Player> getPlayersByTeam(Integer team){
        return playersByTeam.get(team);
    }

    public List<Player> getPlayersByPosition(PlayerPosition position){
        return playersByPosition.get(position);
    }

    public List<Player> getPlayers(){
        return this.players;
    }

    public void transferPlayers(Player playerIn, Player playerOut) {
        if (playerIn == null || playerOut == null) {
            throw new NullPointerException("playerIn or playerOut is null");
        }

        removePlayer(playerOut);

        loadOne(playerIn);
    }


    @Override
    public String toString(){
        return this.players.toString();
    }
}
