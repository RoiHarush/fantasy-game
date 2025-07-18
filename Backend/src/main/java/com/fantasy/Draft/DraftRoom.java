package com.fantasy.Draft;

import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerRepository;
import com.fantasy.User.User;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
//TODO: Add exceptions
public class DraftRoom {
    private static int roomNumberGenerator = 0;
    private final int roomNumber;
    private final DraftRoomType type;
    private List<User> participants;
    private PlayerRepository playersPoll;
    private boolean isForward;
    private int round;
    private int currentTurnIndex;
    private Map<User, List<Player>> turnHistory;
    private boolean isActive;
    private LocalDateTime startAt;
    private LocalDateTime endAt;

    public DraftRoom(){
        this.roomNumber = ++roomNumberGenerator;
        this.type = roomNumber == 1 ? DraftRoomType.INITIAL : DraftRoomType.WEEKLY;
        setActive(false);
        setStartAt(LocalDateTime.now());
    }

    // <editor-fold desc="Getters and Setters">
    public int getRoomNumber() {
        return roomNumber;
    }

    public List<User> getParticipants() {
        return participants;
    }

    public void setParticipants(List<User> participants) {
        this.participants = participants;
    }

    public PlayerRepository getPlayersPoll() {
        return playersPoll;
    }

    public void setPlayersPoll(PlayerRepository playersPoll) {
        this.playersPoll = playersPoll;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public void setStartAt(LocalDateTime startAt) {
        this.startAt = startAt;
    }

    public LocalDateTime getEndAt() {
        return endAt;
    }

    public void setEndAt(LocalDateTime endAt) {
        this.endAt = endAt;
    }

    public Map<User, List<Player>> getTurnHistory(){
        return this.turnHistory;
    }
    // </editor-fold>

    public static void resetRoomNumberGenerator(){
        roomNumberGenerator = 0;
    }

    private void initTurnHistory() {
        this.turnHistory  = new HashMap<>();
        for (User user : this.participants)
            this.turnHistory.put(user, new ArrayList<>());
    }

    public void startDraft(List<User> orderedUsers, PlayerRepository playersPoll){
        setStartAt(LocalDateTime.now());
        setEndAt(LocalDateTime.now().plusMinutes(20));
        setParticipants(orderedUsers);
        setPlayersPoll(playersPoll);
        setActive(true);
        this.round = 1;
        this.currentTurnIndex = 0;
        this.isForward = true;
        initTurnHistory();
    }

    public User getCurrentUser(){
        return this.participants.get(this.currentTurnIndex);
    }

    public boolean isUsersTurn(User user){
        return getCurrentUser().equals(user);
    }

    public void advanceTurn(){
        if (this.isForward) {
            this.currentTurnIndex++;
            if (currentTurnIndex >= participants.size()){
                this.currentTurnIndex = participants.size() - 1;
                this.isForward = false;
                this.round++;
            }
        }
        else {
            this.currentTurnIndex--;
            if (currentTurnIndex < 0){
                this.currentTurnIndex = 0;
                this.isForward = true;
                this.round++;
            }
        }
    }

    public boolean isInitialDraft(){
        return this.type == DraftRoomType.INITIAL;
    }

    public boolean isPlayerAvailable(Player player){
        return this.playersPoll.getById(player.getId()) != null;
    }

    public void removePlayerFromPlayersPoll(Player player){
        this.playersPoll.removePlayer(player);
    }

    public void addPlayerToPlayersPoll(Player player){
        this.playersPoll.loadOne(player);
    }

    public void updateTurnHistory(User user, Player player){
        this.turnHistory.get(user).add(player);
    }

    public boolean isDraftOver(){
        for (User user : this.participants)
            if (user.getFantasyTeam().getSquad().getAllPlayers().size() < 15)
                return false;
        return true;
    }
}