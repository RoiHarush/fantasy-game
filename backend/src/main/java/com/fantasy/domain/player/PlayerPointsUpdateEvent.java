package com.fantasy.domain.player;

import org.springframework.context.ApplicationEvent;

public class PlayerPointsUpdateEvent extends ApplicationEvent {
    private final int playerId;
    private final int gameweek;

    public PlayerPointsUpdateEvent(Object source, int playerId, int gameweek) {
        super(source);
        this.playerId = playerId;
        this.gameweek = gameweek;
    }

    public int getPlayerId() {
        return playerId;
    }

    public int getGameweek() {
        return gameweek;
    }
}