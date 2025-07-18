package com.fantasy.User.Exceptions;

public class WrongPasswordException extends UserException {
    public WrongPasswordException() {
        super("Incorrect password");
    }
}
