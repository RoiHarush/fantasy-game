package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Exceptions.IRException;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.exception.PlayerNotFoundException;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.Exceptions.UserFTeamException;
import com.fantasy.domain.user.Exceptions.UserNotFoundException;
import com.fantasy.domain.user.UserGameData;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UserChipsDto;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserChipMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ChipsService {

    private static final Logger log = LoggerFactory.getLogger(ChipsService.class);

    private final UserService userService;
    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final PlayerRegistry playerRegistry;
    private final PlayerRepository playerRepo;

    public ChipsService(UserService userService,
                        UserGameDataRepository gameDataRepo,
                        UserSquadRepository userSquadRepo,
                        PlayerRegistry playerRegistry,
                        PlayerRepository playerRepo) {
        this.userService = userService;
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.playerRegistry = playerRegistry;
        this.playerRepo = playerRepo;
    }

    public UserChipsDto getUserChips(int userId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);
        return UserChipMapper.toDto(userDomain);
    }


    @Transactional
    public SquadDto assignIR(int userId, int playerId) {

        log.info("Assigning IR: userId={}, playerId={}", userId, playerId);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            userService.useChip(userId, "IR");
        } catch (Exception e) {
            log.error("Error using IR chip for user {}: {}", userId, e.getMessage());
            throw new IRException("Problem with user chips: " + e.getMessage());
        }

        Player player = playerRegistry.findById(playerId);
        if (player == null) {
            log.warn("IR assignment failed: player {} not found", playerId);
            throw new PlayerNotFoundException("Player not found: " + playerId);
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) {
            log.error("IR assignment failed: user {} has no next fantasy team", userId);
            throw new UserFTeamException("UserGameData has no next fantasy team");
        }

        try {
            team.setIR(player);
        } catch (IRException e) {
            log.warn("Invalid IR assignment for user {}: {}", userId, e.getMessage());
            throw e;
        }

        try {
            UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
            if (nextSquadEntity == null) {
                throw new RuntimeException("Next squad entity not found");
            }
            UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
            updatedEntity.setId(nextSquadEntity.getId());
            updatedEntity.setUser(gameDataEntity);
            userSquadRepo.save(updatedEntity);

        } catch (Exception e) {
            log.error("Failed to persist IR assignment for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to persist IR assignment");
        }

        log.info("IR assignment completed successfully for user {}", userId);

        return SquadMapper.toDto(team.getSquad());
    }


    @Transactional
    public SquadDto assignFirstPickCaptain(int userId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            userService.useChip(userId, "FIRST_PICK_CAPTAIN");
        } catch (Exception e) {
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        try {
            team.setFirstPickCaptain();
        } catch (IRException e) {
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            throw new RuntimeException("Next squad entity not found");
        }
        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        userSquadRepo.save(updatedEntity);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseIR(int userId, int playerOutId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            userService.deactivateChip(userId, "IR");
        } catch (Exception e) {
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        Player playerOut = playerRegistry.findById(playerOutId);
        if (playerOut == null) {
            throw new PlayerNotFoundException("Player not found: " + playerOutId);
        }

        try {
            team.releaseIR(playerOut);
        } catch (IRException e) {
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        PlayerEntity playerEntity = playerRepo.findById(playerOutId)
                .orElseThrow(() -> new RuntimeException("Player entity not found"));
        playerEntity.setState(playerOut.getState());
        playerEntity.setOwnerId(playerOut.getOwnerId());
        playerRepo.save(playerEntity);

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            throw new RuntimeException("Next squad entity not found");
        }
        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        userSquadRepo.save(updatedEntity);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseFirstPickCaptain(int userId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            userService.deactivateChip(userId, "FIRST_PICK_CAPTAIN");
        } catch (Exception e) {
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        try {
            team.releaseFirstPickCaptain();
        } catch (IRException e) {
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            throw new RuntimeException("Next squad entity not found");
        }
        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        userSquadRepo.save(updatedEntity);

        return SquadMapper.toDto(team.getSquad());
    }
}