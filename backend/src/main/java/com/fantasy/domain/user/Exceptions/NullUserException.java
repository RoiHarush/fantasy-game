package com.fantasy.domain.user.Exceptions;

public class NullUserException extends UserException {
    public NullUserException() {
        super("This user is NULL");
    }
}
