package com.fantasy.dto;

public class TransferRequestDto {
    private int userId;
    private int playerOutId;
    private int playerInId;

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public int getPlayerOutId() { return playerOutId; }
    public void setPlayerOutId(int playerOutId) { this.playerOutId = playerOutId; }

    public int getPlayerInId() { return playerInId; }
    public void setPlayerInId(int playerInId) { this.playerInId = playerInId; }
}

