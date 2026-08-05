package com.fantasy.domain.auth;

import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.user.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final UserGameDataRepository userGameDataRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final LeagueRepository leagueRepository;

    public AuthService(UserRepository userRepo,
                       UserGameDataRepository userGameDataRepo,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       LeagueRepository leagueRepository) {
        this.userRepo = userRepo;
        this.userGameDataRepo = userGameDataRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.leagueRepository = leagueRepository;
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

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        String name = requireText(request.name(), "Name", 2, 50);
        String username = requireText(request.username(), "Username", 3, 30)
                .toLowerCase(Locale.ROOT);
        String password = requireText(request.password(), "Password", 8, 72);

        if (!username.matches("[a-z0-9._-]+")) {
            throw new IllegalArgumentException(
                    "Username may only contain letters, digits, dots, underscores and hyphens"
            );
        }
        if (userRepo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        UserEntity user = new UserEntity();
        user.setName(name);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRegisteredAt(LocalDateTime.now());
        user.setRole(UserRole.ROLE_USER);
        UserEntity savedUser = userRepo.save(user);

        String token = jwtService.generateToken(savedUser.getId(), savedUser.getRole().name());
        return new LoginResponse(token, buildUserDto(savedUser));
    }

    private UserDto buildUserDto(UserEntity user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
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

        leagueRepository.findFirstByUsers_Id(user.getId()).ifPresent(league -> {
            dto.setLeagueId(league.getId());
            dto.setLeagueAdmin(league.getAdmin().getId().equals(user.getId()));
            dto.setLeagueStatus(league.getStatus().name());
        });

        return dto;
    }

    private String requireText(String value, String field, int minLength, int maxLength) {
        if (value == null) {
            throw new IllegalArgumentException(field + " is required");
        }
        String normalized = value.trim();
        if (normalized.length() < minLength || normalized.length() > maxLength) {
            throw new IllegalArgumentException(
                    field + " must contain between " + minLength + " and " + maxLength + " characters"
            );
        }
        return normalized;
    }
}
