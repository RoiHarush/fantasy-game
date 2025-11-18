package com.fantasy.api;

import com.fantasy.application.SessionManager;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.dto.LoginRequest;
import com.fantasy.dto.LoginResponse;
import com.fantasy.dto.UserDto;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final SessionManager sessionManager;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepo,
                          SessionManager sessionManager,
                          PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.sessionManager = sessionManager;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<UserEntity> userOpt = userRepo.findByUsername(req.username);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("User not found");

        UserEntity user = userOpt.get();

        if (!passwordEncoder.matches(req.password, user.getPassword())) {
            return ResponseEntity.status(401).body("Wrong password");
        }

        String token = sessionManager.createSession(user.getId());

        User domainUser = UserMapper.toDomainUser(user);
        UserDto userDto = UserMapper.toDto(domainUser);

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