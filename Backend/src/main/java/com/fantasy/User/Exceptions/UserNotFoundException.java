package com.fantasy.User.Exceptions;

public class UserNotFoundException extends UserException {
    public UserNotFoundException(String username) {
        super("User not found by this username: " + username);
    }

    public UserNotFoundException(int id){
        super("User not found by this ID: " + id);
    }
}
