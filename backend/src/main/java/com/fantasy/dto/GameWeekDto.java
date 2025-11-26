package com.fantasy.dto;

import java.time.LocalDateTime;

public class GameWeekDto {
    private int id;
    private String name;
    private LocalDateTime firstKickoffTime;
    private LocalDateTime lastKickoffTime;
    private String status;
    private LocalDateTime transferOpenTime;
    private boolean calculated;

    public GameWeekDto(int id, String name, LocalDateTime firstKickoffTime, LocalDateTime lastKickoffTime,
                       String status, LocalDateTime transferOpenTime, boolean calculated) {
        this.id = id;
        this.name = name;
        this.firstKickoffTime = firstKickoffTime;
        this.lastKickoffTime = lastKickoffTime;
        this.status = status;
        this.transferOpenTime = transferOpenTime;
        this.calculated = calculated;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public LocalDateTime getFirstKickoffTime() { return firstKickoffTime; }
    public LocalDateTime getLastKickoffTime() { return lastKickoffTime; }
    public String getStatus() { return status; }
    public LocalDateTime getTransferOpenTime() { return transferOpenTime; }
    public boolean isCalculated() { return calculated; }

}