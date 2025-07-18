package com.fantasy.User.Exceptions;

public class UsernameAlreadyExistException extends UserException {
    public UsernameAlreadyExistException(String username) {
        super("Username already exist" + username);
    }
}
