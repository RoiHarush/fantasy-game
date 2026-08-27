package com.fantasy.domain.user;

import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final long MAX_TEAM_LOGO_BYTES = 3L * 1024L * 1024L;

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

    @Transactional(readOnly = true)
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
        return league.getUsers().stream()
                .map(user -> {
                    UserDto dto = convertToDto(user, league);
                    if (user.getId() != requestingUserId) {
                        dto.setEmail(null);
                    }
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(int requestingUserId, int id) {
        leagueAccessService.requireSameLeague(requestingUserId, id);
        UserEntity user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDto dto = convertToDto(user);
        if (requestingUserId != id) {
            dto.setEmail(null);
        }
        return dto;
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

    @Transactional
    public UserDto updateTeamProfile(int userId, String teamName, MultipartFile logo) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Join or create a league before editing your team"));

        String normalizedTeamName = requireTeamName(teamName);
        gameData.setFantasyTeamName(normalizedTeamName);

        if (logo != null && !logo.isEmpty()) {
            applyTeamLogoUpload(gameData, logo);
        }

        gameDataRepo.save(gameData);
        return convertToDto(user);
    }

    @Transactional
    public UserDto updateTeamLogo(int userId, MultipartFile logo) {
        if (logo == null || logo.isEmpty()) {
            throw new IllegalArgumentException("Choose a team logo to upload");
        }

        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("User does not have a fantasy team"));

        applyTeamLogoUpload(gameData, logo);
        gameDataRepo.save(gameData);
        return convertToDto(user);
    }

    @Transactional
    public UserDto removeTeamLogo(int userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("User does not have a fantasy team"));
        gameData.setTeamLogoBytes(null);
        gameData.setTeamLogoContentType(null);
        gameData.setTeamLogoVersion(System.currentTimeMillis());
        gameDataRepo.save(gameData);
        return convertToDto(user);
    }

    @Transactional(readOnly = true)
    public TeamLogoContent getTeamLogo(int requestingUserId, int userId) {
        leagueAccessService.requireSameLeague(requestingUserId, userId);
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Fantasy team was not found"));
        if (!hasTeamLogo(gameData)) {
            throw new IllegalArgumentException("Fantasy team does not have a custom logo");
        }
        return new TeamLogoContent(
                Arrays.copyOf(gameData.getTeamLogoBytes(), gameData.getTeamLogoBytes().length),
                gameData.getTeamLogoContentType()
        );
    }

    private UserDto convertToDto(UserEntity user) {
        LeagueEntity league = leagueRepository.findFirstByUsers_Id(user.getId()).orElse(null);
        return convertToDto(user, league);
    }

    private UserDto convertToDto(UserEntity user, LeagueEntity league) {
        UserGameDataEntity gameData = gameDataRepo.findByUserId(user.getId()).orElse(null);
        String teamName = gameData == null ? "No Team" : gameData.getFantasyTeamName();

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setRole(user.getRole().name());
        dto.setFantasyTeamName(teamName);
        applyTeamLogo(dto, user.getId(), gameData);
        if (league != null) {
            dto.setLeagueId(league.getId());
            dto.setLeagueAdmin(league.getAdmin().getId().equals(user.getId()));
            dto.setLeagueStatus(league.getStatus().name());
        }
        return dto;
    }

    private void applyTeamLogo(UserDto dto, int userId, UserGameDataEntity gameData) {
        if (!hasTeamLogo(gameData)) {
            dto.setLogoPath("/UI/team-placeholder.svg");
            dto.setLogoVersion(0);
            return;
        }
        dto.setLogoVersion(gameData.getTeamLogoVersion());
        dto.setLogoPath("/api/users/" + userId + "/team-logo?v=" + gameData.getTeamLogoVersion());
    }

    private boolean hasTeamLogo(UserGameDataEntity gameData) {
        return gameData != null
                && gameData.getTeamLogoBytes() != null
                && gameData.getTeamLogoBytes().length > 0;
    }

    private String requireTeamName(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.length() < 2 || normalized.length() > 50) {
            throw new IllegalArgumentException("Team name must contain between 2 and 50 characters");
        }
        return normalized;
    }

    private TeamLogoUpload validateTeamLogo(MultipartFile logo) {
        if (logo.getSize() > MAX_TEAM_LOGO_BYTES) {
            throw new IllegalArgumentException("Team logo may not be larger than 3 MB");
        }
        try {
            byte[] bytes = logo.getBytes();
            String contentType = detectImageType(bytes);
            if (contentType == null) {
                throw new IllegalArgumentException("Upload a PNG, JPEG, WebP, or GIF image");
            }
            return new TeamLogoUpload(bytes, contentType);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the uploaded team logo");
        }
    }

    private void applyTeamLogoUpload(UserGameDataEntity gameData, MultipartFile logo) {
        TeamLogoUpload upload = validateTeamLogo(logo);
        gameData.setTeamLogoBytes(Arrays.copyOf(upload.bytes(), upload.bytes().length));
        gameData.setTeamLogoContentType(upload.contentType());
        gameData.setTeamLogoVersion(System.currentTimeMillis());
    }

    private String detectImageType(byte[] bytes) {
        if (bytes.length >= 8
                && bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return MediaType.IMAGE_PNG_VALUE;
        }
        if (bytes.length >= 3 && bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) {
            return MediaType.IMAGE_JPEG_VALUE;
        }
        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        if (bytes.length >= 6
                && bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == '8'
                && (bytes[4] == '7' || bytes[4] == '9') && bytes[5] == 'a') {
            return MediaType.IMAGE_GIF_VALUE;
        }
        return null;
    }

    public record TeamLogoContent(byte[] bytes, String contentType) {}
    private record TeamLogoUpload(byte[] bytes, String contentType) {}

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
