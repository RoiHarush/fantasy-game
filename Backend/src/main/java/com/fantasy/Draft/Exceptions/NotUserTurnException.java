package com.fantasy.Draft.Exceptions;

public class NotUserTurnException extends DraftException{
    public NotUserTurnException(String message) {
        super(message);
    }

    public NotUserTurnException(){
        super("Not user's turn.");
    }
}
