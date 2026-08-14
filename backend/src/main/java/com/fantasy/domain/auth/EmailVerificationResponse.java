package com.fantasy.domain.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fantasy.domain.user.UserDto;

public record EmailVerificationResponse(
        @JsonIgnore String token,
        UserDto user,
        String message
) {
}
