package com.fantasy.Player;

import com.fantasy.Intefaces.ITeam;
import com.fantasy.Intefaces.Identifiable;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
//TODO: Add exceptions
public class Player  implements Comparable<Player>, Identifiable {
    private static int idGenerator = 0;
    private final int id;
    private String firstName;
    private String lastName;
    private PlayerPosition position;
    private ITeam team;
    private boolean isFirstPick;
    private PlayerState state;
    private boolean captain;
    private boolean isInjured;
    private final Map<Integer, Integer> pointsByGameWeek = new HashMap<>();


    public Player(int id, String firstName, String lastName, PlayerPosition position, ITeam team) {
        this.id = id;
        setName(firstName, lastName);
        setPosition(position);
        setTeam(team);
        setState(PlayerState.NONE);
    }

    public Player(String firstName, String lastName, PlayerPosition position, ITeam team) {
        this(++idGenerator, firstName, lastName, position, team);
    }

    // <editor-fold desc="Getters and Setters">

    public int getId(){
        return this.id;
    }

    public String getName() {
        return firstName + " " + lastName;
    }

    public void setName(String firstName, String lastName) {
        this.firstName = firstName.substring(0,1).toUpperCase() + firstName.substring(1).toLowerCase();
        this.lastName = lastName.substring(0,1).toUpperCase() + lastName.substring(1).toLowerCase();
    }

    public PlayerPosition getPosition() {
        return position;
    }

    public void setPosition(PlayerPosition position) {
        this.position = position;
    }

    public ITeam getTeam() {
        return team;
    }

    private void setTeam(ITeam team) {
        this.team = team;
    }

    public boolean getFirstPick(){
        return isFirstPick;
    }

    public void setFirstPick(boolean isFirstPick){
        this.isFirstPick = isFirstPick;
    }

    public PlayerState getState() {
        return state;
    }

    public void setState(PlayerState state) {
        this.state = state;
    }

    public boolean isCaptain() {
        return captain;
    }

    public void setCaptain(boolean captain) {
        this.captain = captain;
    }

    public boolean isInjured() {
        return isInjured;
    }

    public void setInjured(boolean injured) {
        isInjured = injured;
    }

    // </editor-fold>

    @Override
    public String toString(){
        return this.firstName + ' ' + this.lastName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Player)) return false;
        Player player = (Player) o;
        return this.getId() == player.getId();
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public int compareTo(Player other){
        return this.id - other.id;
    }

    public void addPoints(int gameWeek, int points) {
        pointsByGameWeek.merge(gameWeek, points, Integer::sum);
    }

    public int getPointsForGameWeek(int gameWeek) {
        return pointsByGameWeek.getOrDefault(gameWeek, 0);
    }

}
