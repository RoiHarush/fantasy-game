package com.fantasy.domain.team.Exceptions;

public class NotEnoughPlayersInPositionException extends FantasyTeamException {
    public NotEnoughPlayersInPositionException(String message) {
        super(message);
    }
}
