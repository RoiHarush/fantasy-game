package com.fantasy.application;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.domain.user.UserPointsEntity;

import com.fantasy.dto.AdminUserDetailsDto;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserPointsRepository;
import com.fantasy.infrastructure.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;
import java.util.Map;
import java.util.function.Function;

@Service
public class AdminUserService {

    private final UserRepository userRepo;
    private final UserGameDataRepository gameDataRepo;
    private final UserPointsRepository userPointsRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepo,
                            UserGameDataRepository gameDataRepo,
                            UserPointsRepository userPointsRepo,
                            PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.gameDataRepo = gameDataRepo;
        this.userPointsRepo = userPointsRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AdminUserDetailsDto getFullUserDetails(int userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserGameDataEntity gameData = gameDataRepo.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("User game data not found"));

        AdminUserDetailsDto dto = new AdminUserDetailsDto();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setRegisteredAt(user.getRegisteredAt());

        dto.setFantasyTeamName(gameData.getFantasyTeamName());
        dto.setTotalPoints(gameData.getTotalPoints());

        dto.setChips(new java.util.HashMap<>(gameData.getChips()));
        dto.setActiveChips(new java.util.HashMap<>(gameData.getActiveChips()));

        dto.setGameweekPoints(gameData.getPointsByGameweek().stream()
                .map(upe -> new AdminUserDetailsDto.GameweekPointsDto(
                        upe.getGameweek(),
                        upe.getPoints(),
                        upe.getId()
                ))
                .collect(Collectors.toList()));

        return dto;
    }

    @Transactional
    public void updateFullUserDetails(int userId, AdminUserDetailsDto dto) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserGameDataEntity gameData = gameDataRepo.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("User game data not found"));

        user.setUsername(dto.getUsername());
        user.setName(dto.getName());
        user.setRole(dto.getRole());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        userRepo.save(user);

        gameData.setFantasyTeamName(dto.getFantasyTeamName());
        gameData.setChips(dto.getChips());
        gameData.setActiveChips(dto.getActiveChips());

        Map<Long, UserPointsEntity> existingPointsMap = gameData.getPointsByGameweek().stream()
                .collect(Collectors.toMap(UserPointsEntity::getId, Function.identity()));

        for (AdminUserDetailsDto.GameweekPointsDto pointDto : dto.getGameweekPoints()) {
            UserPointsEntity pointEntity = existingPointsMap.get(pointDto.getPointsEntityId());
            if (pointEntity != null) {
                if (pointEntity.getPoints() != pointDto.getPoints()) {
                    pointEntity.setPoints(pointDto.getPoints());
                }
            }
        }

        int recalculatedTotalPoints = gameData.getPointsByGameweek().stream()
                .mapToInt(UserPointsEntity::getPoints)
                .sum();

        gameData.setTotalPoints(recalculatedTotalPoints);

        gameDataRepo.save(gameData);
    }
}