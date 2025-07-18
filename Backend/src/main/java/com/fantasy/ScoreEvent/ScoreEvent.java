package com.fantasy.ScoreEvent;

import com.fantasy.Player.Player;
//TODO: Add exceptions
public class ScoreEvent {
    private Player player;
    private int minute;
    private ScoreType type;

    public ScoreEvent(Player player, int minute, ScoreType type){
        setPlayer(player);
        setMinute(minute);
        setType(type);
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public ScoreType getType() {
        return type;
    }

    public void setType(ScoreType type) {
        this.type = type;
    }

    public int getMinute() {
        return minute;
    }

    public void setMinute(int minute) {
        this.minute = minute;
    }
}
