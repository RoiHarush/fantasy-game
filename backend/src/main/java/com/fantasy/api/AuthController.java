package com.fantasy.api;

import com.fantasy.application.JwtService;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.*;
import com.fantasy.dto.LoginRequest;
import com.fantasy.dto.LoginResponse;
import com.fantasy.dto.UserDto;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final JwtService jwtService; // החלפנו את SessionManager ב-JwtService
    private final PasswordEncoder passwordEncoder;
    private final UserGameDataRepository userGameDataRepo;
    private final PlayerRegistry playerRegistry;

    public AuthController(UserRepository userRepo,
                          JwtService jwtService, // עדכון בנאי
                          PasswordEncoder passwordEncoder,
                          UserGameDataRepository userGameDataRepo,
                          PlayerRegistry playerRegistry) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userGameDataRepo = userGameDataRepo;
        this.playerRegistry = playerRegistry;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<UserEntity> userOpt = userRepo.findByUsername(req.username);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("User not found");

        UserEntity user = userOpt.get();

        if (!passwordEncoder.matches(req.password, user.getPassword())) {
            return ResponseEntity.status(401).body("Wrong password");
        }

        String token = jwtService.generateToken(user.getId(), user.getRole().name());

        if (user.getRole().equals(UserRole.ROLE_SUPER_ADMIN)){
            User domainUser = UserMapper.toDomainUser(user);
            UserDto userDto = UserMapper.toDto(domainUser);
            return ResponseEntity.ok(new LoginResponse(token, userDto));
        }

        Optional<UserGameDataEntity> dataOpt = userGameDataRepo.findByUserId(user.getId());
        if (dataOpt.isEmpty()) return ResponseEntity.status(401).body("User data not found");

        UserGameDataEntity userGameDataEntity = dataOpt.get();

        User domainUser = UserMapper.toDomainUser(user);
        UserGameData userGameData = UserMapper.toDomainGameData(userGameDataEntity, playerRegistry);
        UserDto userDto = UserMapper.toDto(domainUser, userGameData);

        return ResponseEntity.ok(new LoginResponse(token, userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok("Logged out successfully (Client should clear token)");
    }
}