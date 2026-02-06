package com.fantasy.domain.player;

public class UpdatePositionRequest {
    private int playerId;
    private int positionId; // נשתמש ב-ID של ה-Enum (1-4)

    // Getters & Setters
    public int getPlayerId() { return playerId; }
    public void setPlayerId(int playerId) { this.playerId = playerId; }
    public int getPositionId() { return positionId; }
    public void setPositionId(int positionId) { this.positionId = positionId; }
}