package com.fantasy.dto;

public class LoginResponse {
    public String token;
    public UserDto user;

    public LoginResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}