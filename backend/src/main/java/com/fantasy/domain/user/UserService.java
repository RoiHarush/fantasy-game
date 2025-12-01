package com.fantasy.domain.user;

import com.fantasy.domain.team.UserGameDataRepository; // רק בשביל שם הקבוצה לתצוגה
import com.fantasy.domain.team.UserGameDataEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final UserGameDataRepository gameDataRepo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, UserGameDataRepository gameDataRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.gameDataRepo = gameDataRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> getAllUsers() {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() != UserRole.ROLE_SUPER_ADMIN)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(int id) {
        UserEntity user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(int userId, UpdateProfileDto request) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean changed = false;

        if (request.getName() != null && !request.getName().isBlank() && !request.getName().equals(user.getName())) {
            user.setName(request.getName());
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
        String teamName = gameDataRepo.findByUserId(user.getId())
                .map(UserGameDataEntity::getFantasyTeamName)
                .orElse("No Team");

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setRole(user.getRole().name());
        dto.setFantasyTeamName(teamName);
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");
        return dto;
    }
}