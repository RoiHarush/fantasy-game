package com.fantasy.domain.team;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.player.exception.PlayerNotFoundException;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserMapper;
import com.fantasy.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FantasyTeamService {

    private static final Logger log = LoggerFactory.getLogger(FantasyTeamService.class);

    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekService gameWeekService;
    private final PlayerRegistry playerRegistry;
    private final PlayerRepository playerRepo;
    private final UserRepository userRepo;

    public FantasyTeamService(UserGameDataRepository gameDataRepo,
                              UserSquadRepository userSquadRepo,
                              GameWeekService gameWeekService,
                              PlayerRegistry playerRegistry,
                              PlayerRepository playerRepo,
                              UserRepository userRepo) {
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.gameWeekService = gameWeekService;
        this.playerRegistry = playerRegistry;
        this.playerRepo = playerRepo;
        this.userRepo = userRepo;
    }

    public SquadDto getSquadForGameweek(int userId, Integer gw) {
        int currentGw = gameWeekService.getCurrentGameweek().getId();
        int nextGw = gameWeekService.getNextGameweek().getId();
        int effectiveGw = gw != null ? gw : currentGw;

        UserGameDataEntity gameData = getGameDataEntity(userId);

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
    public SquadDto saveTeam(int userId, SquadDto dto) {
        log.info("Saving team for user {}", userId);

        UserGameDataEntity gameDataEntity = getGameDataEntity(userId);
        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);
        FantasyTeam team = userDomain.getNextFantasyTeam();

        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        Squad squad = SquadMapper.fromDto(dto, playerRegistry);

        try {
            boolean firstPickUsed = Boolean.TRUE.equals(userDomain.getActiveChips().get("FIRST_PICK_CAPTAIN"));
            team.saveSquad(squad, firstPickUsed);
        } catch (FantasyTeamException e) {
            log.warn("Invalid squad for user {}: {}", userId, e.getMessage());
            throw e;
        }

        updatePlayerStatesInDb(squad);
        saveSquadToDb(gameDataEntity, team);

        return SquadMapper.toDto(squad);
    }

    @Transactional
    public void saveTeamForPrevGameweek(int userId, SquadDto dto, int gw) {
        if (gw >= gameWeekService.getCurrentGameweek().getId())
            throw new RuntimeException("Can only update previous gameweeks");

        UserGameDataEntity gameDataEntity = getGameDataEntity(userId);
        UserSquadEntity squad = userSquadRepo.findByUser_IdAndGameweek(userId, gw)
                .orElse(new UserSquadEntity());

        squad.setUser(gameDataEntity);
        squad.setGameweek(gw);

        squad.setStartingLineup(dto.getStartingLineup().values().stream()
                .flatMap(List::stream).collect(Collectors.toList()));
        squad.setBenchMap(dto.getBench());
        squad.setFormation(dto.getFormation());
        squad.setCaptainId(dto.getCaptainId());
        squad.setViceCaptainId(dto.getViceCaptainId());
        squad.setIrId(dto.getIrId());
        squad.setFirstPickId(dto.getFirstPickId());

        userSquadRepo.save(squad);
    }


    public UserChipsDto getUserChips(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, playerRegistry);
        return UserChipMapper.toDto(domain);
    }

    @Transactional
    public SquadDto assignIR(int userId, int playerId) {
        log.info("Assigning IR: User={}, Player={}", userId, playerId);

        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, playerRegistry);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.useChip("IR");

        Player player = playerRegistry.findById(playerId);
        if (player == null) throw new PlayerNotFoundException("Player not found: " + playerId);

        team.setIR(player);

        saveGameDataChips(entity, domain);
        updateSinglePlayerState(playerId, player.getState());
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseIR(int userId, int playerOutId) {
        log.info("Releasing IR: User={}, PlayerOut={}", userId, playerOutId);

        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, playerRegistry);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.deactivateChip("IR");

        Player playerOut = playerRegistry.findById(playerOutId);
        if (playerOut == null) throw new PlayerNotFoundException("Player not found");

        team.releaseIR(playerOut);

        saveGameDataChips(entity, domain);
        updatePlayerStatesInDb(team.getSquad());
        updateSinglePlayerState(playerOutId, playerOut.getState());
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto assignFirstPickCaptain(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, playerRegistry);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.useChip("FIRST_PICK_CAPTAIN");
        team.setFirstPickCaptain();

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseFirstPickCaptain(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, playerRegistry);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.deactivateChip("FIRST_PICK_CAPTAIN");
        team.releaseFirstPickCaptain();

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }


    @Transactional
    public void addToWatchlist(int userId, int playerId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        if (!entity.getWatchedPlayers().contains(playerId)) {
            entity.getWatchedPlayers().add(playerId);
            gameDataRepo.save(entity);
        }
    }

    @Transactional
    public void removeFromWatchlist(int userId, int playerId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        if (entity.getWatchedPlayers().remove(Integer.valueOf(playerId))) {
            gameDataRepo.save(entity);
        }
    }

    public List<Integer> getWatchlist(int userId) {
        return getGameDataEntity(userId).getWatchedPlayers();
    }

    public List<IrStatusDto> getIrStatuses() {
        List<UserGameDataEntity> allTeams = gameDataRepo.findAllWithRelations();
        Map<Integer, String> userNames = userRepo.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getName));

        return allTeams.stream().map(team -> {
            UserGameData domain = UserMapper.toDomainGameData(team, playerRegistry);
            var squad = domain.getNextFantasyTeam() != null ? domain.getNextFantasyTeam().getSquad() : null;
            var ir = squad != null ? squad.getIR() : null;

            return new IrStatusDto(
                    team.getUser().getId(),
                    userNames.getOrDefault(team.getUser().getId(), "Unknown"),
                    domain.getFantasyTeamName(),
                    ir != null,
                    ir != null ? ir.getViewName() : null
            );
        }).collect(Collectors.toList());
    }


    private UserGameDataEntity getGameDataEntity(int userId) {
        return gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData not found for user: " + userId));
    }

    private void saveSquadToDb(UserGameDataEntity gameDataEntity, FantasyTeam team) {
        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) throw new RuntimeException("Next squad entity structure missing");

        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), team.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);

        userSquadRepo.save(updatedEntity);
    }

    private void saveGameDataChips(UserGameDataEntity entity, UserGameData domain) {
        entity.setChips(domain.getChips());
        entity.setActiveChips(domain.getActiveChips());
        gameDataRepo.save(entity);
    }

    private void updatePlayerStatesInDb(Squad squad) {
        List<PlayerEntity> playersToUpdate = new ArrayList<>();
        List<Player> allSquadPlayers = new ArrayList<>();

        squad.getStartingLineup().values().forEach(allSquadPlayers::addAll);
        squad.getBench().values().forEach(allSquadPlayers::add);
        if (squad.getIR() != null) allSquadPlayers.add(squad.getIR());

        for (Player p : allSquadPlayers) {
            if (p != null) {
                playerRepo.findById(p.getId()).ifPresent(pEntity -> {
                    pEntity.setState(p.getState());
                    playersToUpdate.add(pEntity);
                });
            }
        }
        playerRepo.saveAll(playersToUpdate);
    }

    private void updateSinglePlayerState(int playerId, com.fantasy.domain.player.PlayerState state) {
        playerRepo.findById(playerId).ifPresent(p -> {
            p.setState(state);
            playerRepo.save(p);
        });
    }
}