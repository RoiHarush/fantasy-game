package com.fantasy.Match.Exception;

public class TeamNotPartOfTheMatchException extends MatchException {
    public TeamNotPartOfTheMatchException(String message) {
        super(message);
    }

    public TeamNotPartOfTheMatchException() {
        super("Team is not part of this match");
    }
}
