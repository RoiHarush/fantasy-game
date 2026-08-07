package com.fantasy.domain.team;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.league.LeaguePlayerCatalog;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.player.exception.PlayerNotFoundException;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserMapper;
import com.fantasy.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FantasyTeamService {

    private static final Logger log = LoggerFactory.getLogger(FantasyTeamService.class);

    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekService gameWeekService;
    private final UserRepository userRepo;
    private final LeaguePlayerCatalog leaguePlayerCatalog;

    public FantasyTeamService(UserGameDataRepository gameDataRepo,
                              UserSquadRepository userSquadRepo,
                              GameWeekService gameWeekService,
                              UserRepository userRepo,
                              LeaguePlayerCatalog leaguePlayerCatalog) {
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.gameWeekService = gameWeekService;
        this.userRepo = userRepo;
        this.leaguePlayerCatalog = leaguePlayerCatalog;
    }

    @Transactional(readOnly = true)
    public SquadDto getSquadForGameweek(int userId, Integer gw) {
        UserGameDataEntity gameData = getGameDataEntity(userId);
        Integer effectiveGw = gw;
        if (effectiveGw == null) {
            var current = gameWeekService.getCurrentGameweek();
            var next = gameWeekService.getNextGameweek();
            effectiveGw = current != null ? current.getId() : next != null ? next.getId() : null;
        }
        if (effectiveGw == null) return null;

        return userSquadRepo.findByUser_IdAndGameweek(gameData.getId(), effectiveGw)
                .map(entity -> SquadMapper.toDto(SquadMapper.toDomain(entity, catalogFor(gameData))))
                .orElse(null);
    }


    @Transactional
    public SquadDto saveTeam(int userId, SquadDto dto) {
        log.info("Saving team for user {}", userId);

        UserGameDataEntity gameDataEntity = getGameDataEntity(userId);
        Map<Integer, Player> leaguePlayers = catalogFor(gameDataEntity);
        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, leaguePlayers);
        FantasyTeam team = userDomain.getNextFantasyTeam();

        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        Squad squad = SquadMapper.fromDto(dto, leaguePlayers);

        try {
            boolean firstPickUsed = Boolean.TRUE.equals(userDomain.getActiveChips().get("FIRST_PICK_CAPTAIN"));
            team.saveSquad(squad, firstPickUsed);
        } catch (FantasyTeamException e) {
            log.warn("Invalid squad for user {}: {}", userId, e.getMessage());
            throw e;
        }

        saveSquadToDb(gameDataEntity, team);

        return SquadMapper.toDto(squad);
    }

    @Transactional
    public void saveTeamForPrevGameweek(int userId, SquadDto dto, int gw) {
//        if (gw >= gameWeekService.getCurrentGameweek().getId())
//            throw new RuntimeException("Can only update previous gameweeks");

        UserGameDataEntity gameDataEntity = getGameDataEntity(userId);
        UserSquadEntity squad = userSquadRepo.findByUser_IdAndGameweek(gameDataEntity.getId(), gw)
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


    @Transactional(readOnly = true)
    public UserChipsDto getUserChips(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
        return UserChipMapper.toDto(domain);
    }

    @Transactional
    public SquadDto assignIR(int userId, int playerId) {
        log.info("Assigning IR: User={}, Player={}", userId, playerId);

        UserGameDataEntity entity = getGameDataEntity(userId);
        Map<Integer, Player> leaguePlayers = catalogFor(entity);
        UserGameData domain = UserMapper.toDomainGameData(entity, leaguePlayers);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.useChip("IR");

        Player player = leaguePlayers.get(playerId);
        if (player == null) throw new PlayerNotFoundException("Player not found: " + playerId);

        team.setIR(player);

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseIR(int userId, int playerOutId) {
        log.info("Releasing IR: User={}, PlayerOut={}", userId, playerOutId);

        UserGameDataEntity entity = getGameDataEntity(userId);
        Map<Integer, Player> leaguePlayers = catalogFor(entity);
        UserGameData domain = UserMapper.toDomainGameData(entity, leaguePlayers);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.deactivateChip("IR");

        Player playerOut = leaguePlayers.get(playerOutId);
        if (playerOut == null) throw new PlayerNotFoundException("Player not found");

        team.releaseIR(playerOut);

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto assignFirstPickCaptain(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
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
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
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

    @Transactional(readOnly = true)
    public List<Integer> getWatchlist(int userId) {
        return List.copyOf(getGameDataEntity(userId).getWatchedPlayers());
    }

    @Transactional(readOnly = true)
    public List<IrStatusDto> getIrStatuses(long leagueId) {
        List<UserGameDataEntity> allTeams = gameDataRepo.findAllByLeagueIdWithSquads(leagueId);
        Map<Integer, String> userNames = userRepo.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getName));

        return allTeams.stream().map(team -> {
            UserGameData domain = UserMapper.toDomainGameData(team, catalogFor(team));
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

    private Map<Integer, Player> catalogFor(UserGameDataEntity gameData) {
        return leaguePlayerCatalog.load(gameData.getLeague());
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

}
