package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.Exceptions.ChipException;
import com.fantasy.domain.user.UserGameData;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.domain.user.UserRole;
import com.fantasy.dto.IrStatusDto;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UpdateProfileDto;
import com.fantasy.dto.UserDto;
import com.fantasy.api.WatchlistSocketController;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {


    private final UserGameDataRepository gameDataRepo;
    private final UserRepository userRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekService gameWeekService;
    private final WatchlistSocketController watchlistSocketController;
    private final PlayerRegistry playerRegistry;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserGameDataRepository gameDataRepo,
                       UserRepository userRepo,
                       UserSquadRepository userSquadRepo,
                       GameWeekService gameWeekService,
                       WatchlistSocketController watchlistSocketController,
                       PlayerRegistry playerRegistry,
                       PasswordEncoder passwordEncoder) {
        this.userSquadRepo = userSquadRepo;
        this.gameWeekService = gameWeekService;
        this.gameDataRepo = gameDataRepo;
        this.userRepo = userRepo;
        this.watchlistSocketController = watchlistSocketController;
        this.playerRegistry = playerRegistry;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> getAllUsers() {
        List<UserEntity> users = userRepo.findAll();
        List<UserGameDataEntity> gameData = gameDataRepo.findAll();

        Map<Integer, String> teamNameMap = gameData.stream()
                .collect(Collectors.toMap(
                        gd -> gd.getUser().getId(),
                        UserGameDataEntity::getFantasyTeamName
                ));

        return users.stream()
                .filter(user -> user.getRole() != UserRole.ROLE_SUPER_ADMIN)
                .map(user -> {
                    UserDto dto = new UserDto();
                    dto.setId(user.getId());
                    dto.setName(user.getName());
                    dto.setFantasyTeamName(teamNameMap.getOrDefault(user.getId(), "N/A"));
                    dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");
                    dto.setRole(user.getRole().name());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public UserDto getUserById(int id) {
        UserEntity user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserGameDataEntity gameData = gameDataRepo.findByUserId(id)
                .orElseThrow(() -> new RuntimeException("UserGameData not found"));

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setFantasyTeamName(gameData.getFantasyTeamName());
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");

        return dto;
    }

    @Transactional
    public UserDto updateUserProfile(int userId, UpdateProfileDto request) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User game data not found"));

        boolean userChanged = false;
        boolean gameDataChanged = false;

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equals(user.getName())) {
                user.setName(request.getName());
                userChanged = true;
            }
        }

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!request.getUsername().equals(user.getUsername())) {
                if (userRepo.existsByUsername(request.getUsername()))
                    throw new RuntimeException("This user name already exist!");
                user.setUsername(request.getUsername());
                userChanged = true;
            }
        }

        if (request.getTeamName() != null && !request.getTeamName().isBlank()) {
            if (!gameData.getFantasyTeamName().equals(request.getTeamName())) {
                gameData.setFantasyTeamName(request.getTeamName());
                gameDataChanged = true;
            }
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new RuntimeException("Current password is required to set a new password");
            }

            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Incorrect current password");
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userChanged = true;
        }

        if (userChanged) {
            userRepo.save(user);
        }
        if (gameDataChanged) {
            gameDataRepo.save(gameData);
        }

        return UserMapper.toDto(
                UserMapper.toDomainUser(user),
                UserMapper.toDomainGameData(gameData, playerRegistry)
        );
    }

    public SquadDto getSquadForGameweek(int userId, Integer gw) {
        int currentGw = gameWeekService.getCurrentGameweek().getId();
        int nextGw = gameWeekService.getNextGameweek().getId();
        int effectiveGw = gw != null ? gw : currentGw;

        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData not found"));

        if (effectiveGw < currentGw) {
            return userSquadRepo.findByUser_IdAndGameweek(gameData.getId(), effectiveGw)
                    .map(entity -> {
                        Squad squad = SquadMapper.toDomain(entity, playerRegistry);
                        return SquadMapper.toDto(squad);
                    })
                    .orElse(null);
        }

        UserGameData user = UserMapper.toDomainGameData(gameData, playerRegistry);

        Squad squad;
        if (effectiveGw == currentGw) {
            squad = user.getCurrentFantasyTeam().getSquad();
        } else if (effectiveGw == nextGw) {
            squad = user.getNextFantasyTeam().getSquad();
        } else {
            return null;
        }

        return SquadMapper.toDto(squad);
    }

    @Transactional
    public void useChip(int userId, String chip) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        if (userDomain.getChips().get(chip) == null)
            throw new ChipException("UserGameData has no chip such as: " + chip);
        if (!userDomain.hasChipAvailable(chip))
            throw new ChipException("UserGameData has used all his amount of: " + chip);

        userDomain.useChip(chip);

        gameDataEntity.setChips(userDomain.getChips());
        gameDataEntity.setActiveChips(userDomain.getActiveChips());
        gameDataRepo.save(gameDataEntity);
    }

    @Transactional
    public void deactivateChip(int userId, String chip) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        if (userDomain.getChips().get(chip) == null)
            throw new RuntimeException("UserGameData has no chip such as: " + chip);

        userDomain.deactivateChip(chip);

        gameDataEntity.setChips(userDomain.getChips());
        gameDataEntity.setActiveChips(userDomain.getActiveChips());
        gameDataRepo.save(gameDataEntity);
    }


    public List<IrStatusDto> getIrStatuses() {
        List<UserGameDataEntity> gameDataEntities = gameDataRepo.findAllWithRelations();

        Map<Integer, UserEntity> userMap = userRepo.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        return gameDataEntities.stream()
                .map(gameData -> {
                    UserEntity userEntity = userMap.get(gameData.getUser().getId());
                    UserGameData userDomain = UserMapper.toDomainGameData(gameData, playerRegistry);

                    var squad = userDomain.getNextFantasyTeam() != null ? userDomain.getNextFantasyTeam().getSquad() : null;
                    var ir = squad != null ? squad.getIR() : null;

                    return new IrStatusDto(
                            userEntity.getId(), // ID של זהות
                            userEntity.getName(),
                            userDomain.getFantasyTeamName(),
                            ir != null,
                            ir != null ? ir.getViewName() : null
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void addToWatchlist(int userId, int playerId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        List<Integer> watchedPlayers = gameDataEntity.getWatchedPlayers();

        if (!watchedPlayers.contains(playerId)) {
            watchedPlayers.add(playerId);
            gameDataRepo.save(gameDataEntity);
            watchlistSocketController.sendWatchlistUpdate(userId, watchedPlayers);
        }
    }

    @Transactional
    public void removeFromWatchlist(int userId, int playerId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        List<Integer> watchedPlayers = gameDataEntity.getWatchedPlayers();

        if (watchedPlayers.remove(Integer.valueOf(playerId))) {
            gameDataRepo.save(gameDataEntity);
            watchlistSocketController.sendWatchlistUpdate(userId, watchedPlayers);
        }
    }

    public List<Integer> getWatchlist(int userId) {
        UserEntity userEntity = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (userEntity.getRole().equals(UserRole.ROLE_SUPER_ADMIN))
            return new ArrayList<>();

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        return new ArrayList<>(gameDataEntity.getWatchedPlayers());
    }
}