package com.fantasy.domain.user.Exceptions;

public class WrongPasswordException extends UserException {
    public WrongPasswordException() {
        super("Incorrect password");
    }
}
