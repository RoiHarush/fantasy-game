package com.fantasy.api;


import com.fantasy.dto.LoginRequest;
import com.fantasy.dto.LoginResponse;
import com.fantasy.dto.UserDto;
import com.fantasy.application.SessionManager;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.domain.user.UserEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final SessionManager sessionManager;

    public AuthController(UserRepository userRepo, SessionManager sessionManager) {
        this.userRepo = userRepo;
        this.sessionManager = sessionManager;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<UserEntity> userOpt = userRepo.findByUsername(req.username);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("User not found");

        UserEntity user = userOpt.get();
        if (!user.getPassword().equals(req.password))
            return ResponseEntity.status(401).body("Wrong password");

        String token = sessionManager.createSession(user.getId());

        UserDto userDto = UserMapper.toDto(user);

        return ResponseEntity.ok(new LoginResponse(token, userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body("Missing or invalid token header");
        }

        String token = authHeader.substring(7);
        sessionManager.removeSession(token);

        return ResponseEntity.ok("Logged out successfully");
    }

}
