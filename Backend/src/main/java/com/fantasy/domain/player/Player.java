package com.fantasy.domain.player;

import com.fantasy.domain.intefaces.Identifiable;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
//TODO: Add exceptions
public class Player  implements Comparable<Player>, Identifiable {
    private static int idGenerator = 0;
    private final int id;
    private String firstName;
    private String lastName;
    private String viewName;
    private PlayerPosition position;
    private int teamId;
    private PlayerState state;
    private boolean isInjured;
    private final Map<Integer, Integer> pointsByGameweek = new HashMap<>();
    private int ownerId;


    public Player(int id, String firstName, String lastName, PlayerPosition position, int teamId, String viewName) {
        this.id = id;
        setName(firstName, lastName);
        setViewName(viewName);
        setPosition(position);
        setTeamId(teamId);
        setState(PlayerState.NONE);
    }

    public Player(String firstName, String lastName, PlayerPosition position, int team, String viewName) {
        this(++idGenerator, firstName, lastName, position, team, viewName);
    }

    public Player(int id, String firstName, String lastName, String viewName, PlayerPosition position) {
        this(id, firstName, lastName, position, -1, viewName);
    }


    // <editor-fold desc="Getters and Setters">

    public int getId(){
        return this.id;
    }

    public String getName() {
        return firstName + " " + lastName;
    }

    public String getFirstName(){
        return firstName;
    }

    public String getLastName(){
        return lastName;
    }

    public void setName(String firstName, String lastName) {
        this.firstName = firstName.substring(0,1).toUpperCase() + firstName.substring(1).toLowerCase();
        this.lastName = lastName.substring(0,1).toUpperCase() + lastName.substring(1).toLowerCase();
    }

    public String getViewName() {
        return viewName;
    }

    public void setViewName(String viewName) {
        this.viewName = viewName;
    }

    public PlayerPosition getPosition() {
        return position;
    }

    public void setPosition(PlayerPosition position) {
        this.position = position;
    }

    public int getTeamId() {
        return teamId;
    }

    public void setTeamId(int team) {
        this.teamId = team;
    }

    public PlayerState getState() {
        return state;
    }

    public void setState(PlayerState state) {
        this.state = state;
    }

    public boolean isInjured() {
        return isInjured;
    }

    public void setInjured(boolean injured) {
        isInjured = injured;
    }

    public void setOwnerId(int ownerId){
        this.ownerId = ownerId;
    }

    public int getOwnerId() {
        return ownerId;
    }

    public Map<Integer, Integer> getPointsByGameweek() {
        return pointsByGameweek;
    }

    public int getTotalPoints(){
        return pointsByGameweek.values().stream().mapToInt(Integer::intValue).sum();
    }

    // </editor-fold>

    @Override
    public String toString(){
        return this.firstName + ' ' + this.lastName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Player player)) return false;
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
        pointsByGameweek.merge(gameWeek, points, Integer::sum);
    }

    public int getPointsForGameWeek(int gameWeek) {
        return pointsByGameweek.getOrDefault(gameWeek, 0);
    }

}
