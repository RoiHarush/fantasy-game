package com.fantasy.domain.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fantasy.domain.user.UserDto;

public class LoginResponse {
    @JsonIgnore
    public String token;
    public UserDto user;

    public LoginResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}
