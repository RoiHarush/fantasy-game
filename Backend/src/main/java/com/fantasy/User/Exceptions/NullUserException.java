package com.fantasy.User.Exceptions;

public class NullUserException extends UserException {
    public NullUserException() {
        super("This user is NULL");
    }
}
