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

import java.util.ArrayList;
import java.util.List;

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
        log.debug("Fetching chips for user {}", userId);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("User {} not found when fetching chips", userId);
                    return new UserNotFoundException(userId);
                });

        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);
        log.debug("Successfully fetched chips → user={}", userId);
        return UserChipMapper.toDto(userDomain);
    }

    @Transactional
    public SquadDto assignIR(int userId, int playerId) {

        log.info("Assigning IR → userId={}, playerId={}", userId, playerId);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("UserGameData not found for user {}", userId);
                    return new UserNotFoundException(userId);
                });

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            log.debug("Using IR chip for user {}", userId);
            userService.useChip(userId, "IR");
        } catch (Exception e) {
            log.error("Failed to use IR chip for user {}: {}", userId, e.getMessage());
            throw new IRException("Problem with user chips: " + e.getMessage());
        }

        Player player = playerRegistry.findById(playerId);
        if (player == null) {
            log.warn("Assign IR failed: player {} not found", playerId);
            throw new PlayerNotFoundException("Player not found: " + playerId);
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) {
            log.error("Assign IR failed: user {} has no next fantasy team", userId);
            throw new UserFTeamException("UserGameData has no next fantasy team");
        }

        try {
            log.debug("Setting IR for user {}, player {}", userId, playerId);
            team.setIR(player);
        } catch (IRException e) {
            log.warn("Invalid IR assignment for user {}: {}", userId, e.getMessage());
            throw e;
        }

        PlayerEntity pEntity = playerRepo.findById(playerId)
                .orElseThrow(() -> new PlayerNotFoundException("Player not found"));
        pEntity.setState(player.getState());
        playerRepo.save(pEntity);

        try {
            log.debug("Persisting updated squad for user {}", userId);

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

        log.info("IR assignment completed successfully → user {}", userId);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto assignFirstPickCaptain(int userId) {

        log.info("Assigning First Pick Captain → userId={}", userId);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("UserGameData not found for user {}", userId);
                    return new UserNotFoundException(userId);
                });

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            log.debug("Using FIRST_PICK_CAPTAIN chip for user {}", userId);
            userService.useChip(userId, "FIRST_PICK_CAPTAIN");
        } catch (Exception e) {
            log.error("Failed using FIRST_PICK_CAPTAIN chip for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) {
            log.error("Assign First Pick Captain failed: user {} has no next fantasy team", userId);
            throw new RuntimeException("UserGameData has no next fantasy team");
        }

        try {
            log.debug("Setting First Pick Captain for user {}", userId);
            team.setFirstPickCaptain();
        } catch (IRException e) {
            log.warn("Invalid First Pick Captain assignment for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            log.error("Next squad entity not found for user {}", userId);
            throw new RuntimeException("Next squad entity not found");
        }

        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        userSquadRepo.save(updatedEntity);

        log.info("First Pick Captain assigned successfully → user {}", userId);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseIR(int userId, int playerOutId) {

        log.info("Releasing IR → userId={}, playerOutId={}", userId, playerOutId);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("UserGameData not found for user {}", userId);
                    return new UserNotFoundException(userId);
                });

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            log.debug("Deactivating IR chip for user {}", userId);
            userService.deactivateChip(userId, "IR");
        } catch (Exception e) {
            log.error("Failed deactivating IR chip for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) {
            log.error("Release IR failed: user {} has no next fantasy team", userId);
            throw new RuntimeException("UserGameData has no next fantasy team");
        }

        Player playerOut = playerRegistry.findById(playerOutId);
        if (playerOut == null) {
            log.warn("Release IR failed: player {} not found", playerOutId);
            throw new PlayerNotFoundException("Player not found: " + playerOutId);
        }

        try {
            log.debug("Releasing player {} from IR for user {}", playerOutId, userId);
            team.releaseIR(playerOut);
        } catch (IRException e) {
            log.warn("Invalid IR release for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Invalid IR release: " + e.getMessage());
        }

        List<PlayerEntity> playersToUpdate = new ArrayList<>();

        PlayerEntity outEntity = playerRepo.findById(playerOutId).orElse(null);
        if (outEntity != null) {
            outEntity.setState(playerOut.getState());
            outEntity.setOwnerId(playerOut.getOwnerId());
            playersToUpdate.add(outEntity);
        }

        List<Player> activeSquad = new ArrayList<>();
        team.getSquad().getStartingLineup().values().forEach(activeSquad::addAll);
        team.getSquad().getBench().values().forEach(activeSquad::add);

        for (Player p : activeSquad) {
            if (p != null) {
                PlayerEntity pEntity = playerRepo.findById(p.getId()).orElse(null);
                if (pEntity != null) {
                    pEntity.setState(p.getState());
                    playersToUpdate.add(pEntity);
                }
            }
        }

        playerRepo.saveAll(playersToUpdate);

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            log.error("Next squad entity not found for user {}", userId);
            throw new RuntimeException("Next squad entity not found");
        }

        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        userSquadRepo.save(updatedEntity);

        log.info("IR released successfully → user {}", userId);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseFirstPickCaptain(int userId) {

        log.info("Releasing First Pick Captain → userId={}", userId);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("UserGameData not found for user {}", userId);
                    return new UserNotFoundException(userId);
                });

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        try {
            log.debug("Deactivating FIRST_PICK_CAPTAIN chip for user {}", userId);
            userService.deactivateChip(userId, "FIRST_PICK_CAPTAIN");
        } catch (Exception e) {
            log.error("Failed deactivating FIRST_PICK_CAPTAIN chip for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) {
            log.error("Release First Pick Captain failed: user {} has no next fantasy team", userId);
            throw new RuntimeException("UserGameData has no next fantasy team");
        }

        try {
            log.debug("Releasing First Pick Captain for user {}", userId);
            team.releaseFirstPickCaptain();
        } catch (IRException e) {
            log.warn("Invalid First Pick Captain release for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            log.error("Next squad entity not found for user {}", userId);
            throw new RuntimeException("Next squad entity not found");
        }

        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        userSquadRepo.save(updatedEntity);

        log.info("First Pick Captain released successfully → user {}", userId);

        return SquadMapper.toDto(team.getSquad());
    }
}
