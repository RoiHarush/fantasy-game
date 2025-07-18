package com.fantasy.RealWorldData;

import com.fantasy.Intefaces.ITeam;
import com.fantasy.Game.GameWeek;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.ScoreEvent.ScoreType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
//TODO: Add exceptions
public class Team implements ITeam {
    private TeamName teamName;
    private Map<PlayerPosition, List<Player>> playersByPosition;
    Map<ScoreType, Map<GameWeek, Integer>> teamData;

    public Team(String teamName){
        setName(teamName);
        setTeamData();
    }

    public String getName() {
        return teamName.toString();
    }

    public void setName(String teamName) {
        this.teamName = TeamName.valueOf(teamName);
    }

    public Map<PlayerPosition, List<Player>> getPlayersByPosition() {
        return playersByPosition;
    }

    public void setPlayersByPosition(List<Player> players) {
        this.playersByPosition = new HashMap<>();
        for (PlayerPosition position : PlayerPosition.values()) {
            this.playersByPosition.put(position, new ArrayList<>());
            for (Player player : players)
                if (player.getPosition().equals(position))
                    this.playersByPosition.get(position).add(player);
        }

    }

    public  Map<ScoreType, Map<GameWeek, Integer>> getTeamData() {
        return teamData;
    }

    public void setTeamData() {
        this.teamData = new HashMap<>();
        for (ScoreType scoreType : ScoreType.values()){
            this.teamData.put(scoreType, new HashMap<>());
        }
    }

    @Override
    public String toString(){
        return (this.teamName.name().trim().replace('_',' ')
                + ':' + '\n');

    }
}
