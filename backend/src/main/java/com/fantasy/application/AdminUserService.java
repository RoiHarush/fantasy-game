package com.fantasy.application;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.domain.user.UserPointsEntity;

import com.fantasy.dto.AdminUserDetailsDto;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserPointsRepository;
import com.fantasy.infrastructure.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.function.Function;

@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

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

        log.debug("Fetching full user details for user {}", userId);

        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.error("getFullUserDetails: user {} not found", userId);
                    return new RuntimeException("User not found");
                });

        UserGameDataEntity gameData = gameDataRepo.findByUserId(user.getId())
                .orElseThrow(() -> {
                    log.error("getFullUserDetails: game data not found for user {}", userId);
                    return new RuntimeException("User game data not found");
                });

        log.debug("User {} and its game data were successfully retrieved", userId);

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

        log.debug("Returning full admin user details for user {}. GW entries={}",
                userId, dto.getGameweekPoints().size());

        return dto;
    }

    @Transactional
    public void updateFullUserDetails(int userId, AdminUserDetailsDto dto) {

        log.info("Updating full user details → user {}", userId);

        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.error("updateFullUserDetails: user {} not found", userId);
                    return new RuntimeException("User not found");
                });

        UserGameDataEntity gameData = gameDataRepo.findByUserId(user.getId())
                .orElseThrow(() -> {
                    log.error("updateFullUserDetails: game data not found for user {}", userId);
                    return new RuntimeException("User game data not found");
                });

        if (!user.getUsername().equals(dto.getUsername())) {
            log.debug("Username updated → '{}' → '{}'", user.getUsername(), dto.getUsername());
        }
        if (!Objects.equals(user.getName(), dto.getName())) {
            log.debug("Name updated → '{}' → '{}'", user.getName(), dto.getName());
        }
        if (user.getRole() != dto.getRole()) {
            log.debug("Role updated → {} → {}", user.getRole(), dto.getRole());
        }

        user.setUsername(dto.getUsername());
        user.setName(dto.getName());
        user.setRole(dto.getRole());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            log.debug("Password updated for user {}", userId);
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        userRepo.save(user);

        if (!Objects.equals(gameData.getFantasyTeamName(), dto.getFantasyTeamName())) {
            log.debug("Fantasy team name updated → '{}' → '{}'",
                    gameData.getFantasyTeamName(), dto.getFantasyTeamName());
        }

        gameData.setFantasyTeamName(dto.getFantasyTeamName());
        gameData.setChips(dto.getChips());
        gameData.setActiveChips(dto.getActiveChips());

        Map<Long, UserPointsEntity> existingPointsMap = gameData.getPointsByGameweek().stream()
                .collect(Collectors.toMap(UserPointsEntity::getId, Function.identity()));

        for (AdminUserDetailsDto.GameweekPointsDto pointDto : dto.getGameweekPoints()) {
            UserPointsEntity pointEntity = existingPointsMap.get(pointDto.getPointsEntityId());
            if (pointEntity != null) {
                if (pointEntity.getPoints() != pointDto.getPoints()) {
                    log.debug("GW {} points updated → {} → {}",
                            pointDto.getGameweek(),
                            pointEntity.getPoints(),
                            pointDto.getPoints());
                    pointEntity.setPoints(pointDto.getPoints());
                }
            }
        }

        int recalculatedTotalPoints = gameData.getPointsByGameweek().stream()
                .mapToInt(UserPointsEntity::getPoints)
                .sum();

        log.debug("Total points recalculated for user {} → {}", userId, recalculatedTotalPoints);

        gameData.setTotalPoints(recalculatedTotalPoints);

        gameDataRepo.save(gameData);

        log.info("Finished updating full user details → user {}", userId);
    }
}
