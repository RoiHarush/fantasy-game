package com.fantasy.domain.auth;

import com.fantasy.domain.user.UserDto;

public class LoginResponse {
    public String token;
    public UserDto user;

    public LoginResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}