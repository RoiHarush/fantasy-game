package com.fantasy.domain.user.Exceptions;

public class InvalidUserDetailsException extends RuntimeException {
    public InvalidUserDetailsException(String message) {
        super(message);
    }
}
