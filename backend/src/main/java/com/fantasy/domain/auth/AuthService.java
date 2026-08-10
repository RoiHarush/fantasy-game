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

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(int userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user was not found"));
        return buildUserDto(user);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        NameParts nameParts = resolveName(request);
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
        user.setFirstName(nameParts.firstName());
        user.setLastName(nameParts.lastName());
        user.setName(nameParts.fullName());
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
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole().name());
        dto.setLogoPath("/UI/team-placeholder.svg");

        if (user.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            dto.setFantasyTeamName("N/A");
            return dto;
        }

        UserGameDataEntity gameData = userGameDataRepo.findByUserId(user.getId()).orElse(null);
        String teamName = gameData == null ? "No Team" : gameData.getFantasyTeamName();

        dto.setFantasyTeamName(teamName);
        if (gameData != null && gameData.getTeamLogoBytes() != null && gameData.getTeamLogoBytes().length > 0) {
            dto.setLogoVersion(gameData.getTeamLogoVersion());
            dto.setLogoPath("/api/users/" + user.getId() + "/team-logo?v=" + gameData.getTeamLogoVersion());
        } else {
            dto.setLogoPath("/UI/team-placeholder.svg");
        }

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

    private NameParts resolveName(RegisterRequest request) {
        if (request.firstName() != null && !request.firstName().isBlank()
                && request.lastName() != null && !request.lastName().isBlank()) {
            String firstName = requireText(request.firstName(), "First name", 1, 50);
            String lastName = requireText(request.lastName(), "Last name", 1, 50);
            return new NameParts(firstName, lastName);
        }

        String legacyName = requireText(request.name(), "Name", 2, 100);
        int separator = legacyName.indexOf(' ');
        if (separator < 0) {
            return new NameParts(legacyName, "");
        }
        return new NameParts(legacyName.substring(0, separator), legacyName.substring(separator + 1).trim());
    }

    private record NameParts(String firstName, String lastName) {
        private String fullName() {
            return (firstName + " " + lastName).trim();
        }
    }
}
