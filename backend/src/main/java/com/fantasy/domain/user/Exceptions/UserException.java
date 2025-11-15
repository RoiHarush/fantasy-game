package com.fantasy.domain.user.Exceptions;

public class UserException extends RuntimeException {
    public UserException(String message) {
        super(message);
    }

    public UserException(){
      super("Unexpected user exception");
    }
}
