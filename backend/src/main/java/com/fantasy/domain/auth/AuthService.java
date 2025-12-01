package com.fantasy.domain.auth;

import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.user.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final UserGameDataRepository userGameDataRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepo, UserGameDataRepository userGameDataRepo, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.userGameDataRepo = userGameDataRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest req) {
        UserEntity user = userRepo.findByUsername(req.username().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        String token = jwtService.generateToken(user.getId(), user.getRole().name());

        UserDto userDto = buildUserDto(user);

        return new LoginResponse(token, userDto);
    }

    private UserDto buildUserDto(UserEntity user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setRole(user.getRole().name());
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");

        if (user.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            dto.setFantasyTeamName("N/A");
            return dto;
        }

        String teamName = userGameDataRepo.findByUserId(user.getId())
                .map(UserGameDataEntity::getFantasyTeamName)
                .orElse("No Team");

        dto.setFantasyTeamName(teamName);

        return dto;
    }
}