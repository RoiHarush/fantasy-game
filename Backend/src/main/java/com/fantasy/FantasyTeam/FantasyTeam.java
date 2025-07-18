package com.fantasy.FantasyTeam;

import com.fantasy.Game.GameWeek;
import com.fantasy.Intefaces.IFantasyTeam;
import com.fantasy.Player.Player;

import java.util.HashMap;
import java.util.Map;

//TODO: Add exceptions
public class FantasyTeam implements IFantasyTeam {
    protected static int idGenerator = 0;
    protected final int id;
    private final Squad squad;
    protected String name;
    protected int totalPoints;
    protected Map<Integer, Integer> weeklyPoints;

    public FantasyTeam(String teamName, int totalPoints){
        this.id = ++idGenerator;
        this.squad = new Squad();
        setName(teamName);
        setTotalPoints(totalPoints);
        setWeeklyPoints();
    }

    public FantasyTeam(String teamName){
        this(teamName, 0);
    }

    public Squad getSquad(){
        return this.squad;
    }

    public int getId(){
        return this.id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(int totalPoints) {
        this.totalPoints = totalPoints;
    }

    public int getWeeklyPoints(int gameWeek) {
        return weeklyPoints.get(gameWeek);
    }

    public void setWeeklyPoints() {
        this.weeklyPoints = new HashMap<>();
    }

    @Override
    public String toString() {
        return name + '\n' + this.squad;
    }

    public void addPoints(int gameWeek, int points){
        this.weeklyPoints.merge(gameWeek, points, Integer :: sum);
        int sumTotal = this.weeklyPoints.values()
                .stream().mapToInt(Integer :: intValue).sum();
        setTotalPoints(sumTotal);
    }

    public void makePick(Player player){
        this.squad.makePick(player);
    }

    public void makeTransfer(Player playerIn, Player playerOut){
        this.squad.makeTransfer(playerIn, playerOut);
    }

    public boolean playerContain(Player player){
        return this.squad.getPlayerById(player.getId()) != null;
    }

    public void setCaptain(Player captain){
        this.squad.assignCaptain(captain);
    }

    public void setViceCaptain(Player viceCaptain){
        this.squad.assignViceCaptain(viceCaptain);
    }
}