package com.fantasy.domain.user.Exceptions;

public class UserNotFoundException extends UserException {
    public UserNotFoundException(String username) {
        super("UserGameData not found by this username: " + username);
    }

    public UserNotFoundException(int id){
        super("UserGameData not found by this ID: " + id);
    }
}
