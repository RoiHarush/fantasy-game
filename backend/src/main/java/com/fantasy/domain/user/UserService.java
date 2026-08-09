package com.fantasy.domain.user;

import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final UserGameDataRepository gameDataRepo;
    private final PasswordEncoder passwordEncoder;
    private final LeagueRepository leagueRepository;
    private final LeagueAccessService leagueAccessService;

    public UserService(UserRepository userRepo,
                       UserGameDataRepository gameDataRepo,
                       PasswordEncoder passwordEncoder,
                       LeagueRepository leagueRepository,
                       LeagueAccessService leagueAccessService) {
        this.userRepo = userRepo;
        this.gameDataRepo = gameDataRepo;
        this.passwordEncoder = passwordEncoder;
        this.leagueRepository = leagueRepository;
        this.leagueAccessService = leagueAccessService;
    }

    public List<UserDto> getAllUsers(int requestingUserId) {
        UserEntity requestingUser = userRepo.findById(requestingUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (requestingUser.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            return userRepo.findAll().stream()
                .filter(u -> u.getRole() != UserRole.ROLE_SUPER_ADMIN)
                .map(this::convertToDto)
                .collect(Collectors.toList());
        }

        LeagueEntity league = leagueRepository.findFirstByUsers_Id(requestingUserId)
                .orElseThrow(() -> new IllegalStateException("User is not in a league"));
        return league.getUsers().stream().map(user -> convertToDto(user, league)).toList();
    }

    public UserDto getUserById(int requestingUserId, int id) {
        leagueAccessService.requireSameLeague(requestingUserId, id);
        UserEntity user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(int userId, UpdateProfileDto request) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean changed = false;

        boolean profileNameChanged = false;
        if (request.getFirstName() != null) {
            String firstName = requireProfileName(request.getFirstName(), "First name");
            if (!Objects.equals(firstName, user.getFirstName())) {
                user.setFirstName(firstName);
                profileNameChanged = true;
            }
        }
        if (request.getLastName() != null) {
            String lastName = requireProfileName(request.getLastName(), "Last name");
            if (!Objects.equals(lastName, user.getLastName())) {
                user.setLastName(lastName);
                profileNameChanged = true;
            }
        }
        if (profileNameChanged) {
            user.setName(user.getFullName());
            changed = true;
        } else if (request.getName() != null && !request.getName().isBlank() && !request.getName().equals(user.getName())) {
            // Backwards compatibility for older clients that still submit one full-name field.
            String legacyName = request.getName().trim();
            String[] parts = legacyName.split("\\s+", 2);
            user.setFirstName(requireProfileName(parts[0], "First name"));
            user.setLastName(parts.length > 1 ? requireProfileName(parts[1], "Last name") : "");
            user.setName(user.getFullName());
            changed = true;
        }

        if (request.getUsername() != null && !request.getUsername().isBlank() && !request.getUsername().equals(user.getUsername())) {
            if (userRepo.existsByUsername(request.getUsername())) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(request.getUsername());
            changed = true;
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Incorrect current password");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            changed = true;
        }

        if (request.getTeamName() != null && !request.getTeamName().isBlank()) {
            gameDataRepo.findByUserId(userId).ifPresent(gameData -> {
                if (!gameData.getFantasyTeamName().equals(request.getTeamName())) {
                    gameData.setFantasyTeamName(request.getTeamName());
                    gameDataRepo.save(gameData);
                }
            });
        }

        if (changed) {
            userRepo.save(user);
        }

        return convertToDto(user);
    }

    private UserDto convertToDto(UserEntity user) {
        LeagueEntity league = leagueRepository.findFirstByUsers_Id(user.getId()).orElse(null);
        return convertToDto(user, league);
    }

    private UserDto convertToDto(UserEntity user, LeagueEntity league) {
        String teamName = gameDataRepo.findByUserId(user.getId())
                .map(UserGameDataEntity::getFantasyTeamName)
                .orElse("No Team");

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole().name());
        dto.setFantasyTeamName(teamName);
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");
        if (league != null) {
            dto.setLeagueId(league.getId());
            dto.setLeagueAdmin(league.getAdmin().getId().equals(user.getId()));
            dto.setLeagueStatus(league.getStatus().name());
        }
        return dto;
    }

    private String requireProfileName(String value, String label) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException(label + " is required");
        }
        if (normalized.length() > 50) {
            throw new IllegalArgumentException(label + " may contain at most 50 characters");
        }
        return normalized;
    }
}
