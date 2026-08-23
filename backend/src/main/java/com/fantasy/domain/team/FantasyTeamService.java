package com.fantasy.domain.team;

import com.fantasy.config.AfterCommitExecutor;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.league.LeaguePlayerCatalog;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationEvents;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.player.exception.PlayerNotFoundException;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserMapper;
import com.fantasy.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FantasyTeamService {

    private static final Logger log = LoggerFactory.getLogger(FantasyTeamService.class);

    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekService gameWeekService;
    private final UserRepository userRepo;
    private final LeaguePlayerCatalog leaguePlayerCatalog;
    private final AutoSubstitutionRepository autoSubstitutionRepository;
    private ApplicationEventPublisher applicationEvents = event -> { };

    public FantasyTeamService(UserGameDataRepository gameDataRepo,
                              UserSquadRepository userSquadRepo,
                              GameWeekService gameWeekService,
                              UserRepository userRepo,
                              LeaguePlayerCatalog leaguePlayerCatalog,
                              AutoSubstitutionRepository autoSubstitutionRepository) {
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.gameWeekService = gameWeekService;
        this.userRepo = userRepo;
        this.leaguePlayerCatalog = leaguePlayerCatalog;
        this.autoSubstitutionRepository = autoSubstitutionRepository;
    }

    @Autowired
    void setApplicationEvents(ApplicationEventPublisher applicationEvents) {
        this.applicationEvents = applicationEvents;
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
                .map(entity -> toSquadDtoWithAutoSubstitutions(entity, gameData))
                .orElse(null);
    }


    @Transactional
    public SquadDto saveTeam(int userId, SquadDto dto) {
        log.info("Saving team for user {}", userId);

        UserGameDataEntity gameDataEntity = getGameDataEntity(userId);
        validateSquadUpdatePreservesOwnership(gameDataEntity.getNextSquad(), dto);
        Map<Integer, Player> leaguePlayers = catalogFor(gameDataEntity);
        UserGameData userDomain = UserMapper.toDomainGameData(gameDataEntity, leaguePlayers);
        FantasyTeam team = userDomain.getNextFantasyTeam();

        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        Squad squad = SquadMapper.fromDto(dto, leaguePlayers);

        try {
            boolean firstPickUsed = Boolean.TRUE.equals(
                    userDomain.getActiveChips().get(ChipNames.FIRST_PICK_CAPTAIN)
            );
            squad.setTripleCaptainActive(gameDataEntity.getNextSquad().isTripleCaptainActive());
            squad.setBenchBoostActive(gameDataEntity.getNextSquad().isBenchBoostActive());
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

        Player player = leaguePlayers.get(playerId);
        if (player == null) throw new PlayerNotFoundException("Player not found: " + playerId);

        domain.useIrChipFor(player);
        team.setIR(player);

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        publishLeagueNotification(entity, NotificationEvents.irActivated(
                userId,
                entity.getNextSquad().getGameweek(),
                playerId,
                entity.getUser().getFullName(),
                player.getViewName()
        ));

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto releaseIR(int userId, int playerOutId) {
        log.info("Releasing IR: User={}, PlayerOut={}", userId, playerOutId);

        UserGameDataEntity entity = getGameDataEntity(userId);
        Map<Integer, Player> leaguePlayers = catalogFor(entity);
        UserGameData domain = UserMapper.toDomainGameData(entity, leaguePlayers);
        FantasyTeam team = domain.getNextFantasyTeam();

        domain.deactivateChip(ChipNames.IR);

        Player playerOut = leaguePlayers.get(playerOutId);
        if (playerOut == null) throw new PlayerNotFoundException("Player not found");

        team.releaseIR(playerOut);

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        publishLeagueNotification(entity, NotificationEvents.irReleased(
                userId,
                entity.getNextSquad().getGameweek(),
                playerOutId,
                entity.getUser().getFullName(),
                playerOut.getViewName()
        ));

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto assignFirstPickCaptain(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
        FantasyTeam team = domain.getNextFantasyTeam();

        if (Boolean.TRUE.equals(domain.getActiveChips().get(ChipNames.TRIPLE_CAPTAIN))) {
            throw new IllegalStateException("Triple Captain and First Pick Captain cannot be active together");
        }

        domain.useChip(ChipNames.FIRST_PICK_CAPTAIN);
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

        domain.deactivateChip(ChipNames.FIRST_PICK_CAPTAIN);
        team.releaseFirstPickCaptain();

        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, team);

        return SquadMapper.toDto(team.getSquad());
    }

    @Transactional
    public SquadDto assignTripleCaptain(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
        Squad squad = requireNextSquad(domain);

        if (Boolean.TRUE.equals(domain.getActiveChips().get(ChipNames.FIRST_PICK_CAPTAIN))
                || samePlayer(squad.getCaptain(), squad.getFirstPick())) {
            throw new IllegalStateException(
                    "Triple Captain cannot be used while the first-pick player is captain"
            );
        }

        domain.useChip(ChipNames.TRIPLE_CAPTAIN);
        squad.setTripleCaptainActive(true);
        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, domain.getNextFantasyTeam());
        return SquadMapper.toDto(squad);
    }

    @Transactional
    public SquadDto releaseTripleCaptain(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
        Squad squad = requireNextSquad(domain);

        domain.deactivateChip(ChipNames.TRIPLE_CAPTAIN);
        squad.setTripleCaptainActive(false);
        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, domain.getNextFantasyTeam());
        return SquadMapper.toDto(squad);
    }

    @Transactional
    public SquadDto assignBenchBoost(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
        Squad squad = requireNextSquad(domain);

        domain.useChip(ChipNames.BENCH_BOOST);
        squad.setBenchBoostActive(true);
        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, domain.getNextFantasyTeam());
        return SquadMapper.toDto(squad);
    }

    @Transactional
    public SquadDto releaseBenchBoost(int userId) {
        UserGameDataEntity entity = getGameDataEntity(userId);
        UserGameData domain = UserMapper.toDomainGameData(entity, catalogFor(entity));
        Squad squad = requireNextSquad(domain);

        domain.deactivateChip(ChipNames.BENCH_BOOST);
        squad.setBenchBoostActive(false);
        saveGameDataChips(entity, domain);
        saveSquadToDb(entity, domain.getNextFantasyTeam());
        return SquadMapper.toDto(squad);
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

    private SquadDto toSquadDtoWithAutoSubstitutions(UserSquadEntity entity,
                                                      UserGameDataEntity gameData) {
        SquadDto dto = SquadMapper.toDto(SquadMapper.toDomain(entity, catalogFor(gameData)));
        if (entity.getId() == null) return dto;

        dto.setAutoSubstitutions(autoSubstitutionRepository
                .findBySquad_IdOrderBySequenceAsc(entity.getId())
                .stream()
                .map(substitution -> new AutoSubstitutionDto(
                        substitution.getPlayerInId(),
                        substitution.getPlayerOutId(),
                        substitution.getSequence()
                ))
                .toList());
        dto.setCrownPlayerId(entity.getCrownPlayerId());
        dto.setCrownPoints(entity.getCrownPoints());
        return dto;
    }

    private Squad requireNextSquad(UserGameData domain) {
        if (domain.getNextFantasyTeam() == null || domain.getNextFantasyTeam().getSquad() == null) {
            throw new IllegalStateException("There is no upcoming squad to apply this chip to");
        }
        return domain.getNextFantasyTeam().getSquad();
    }

    private boolean samePlayer(Player first, Player second) {
        return first != null && second != null && first.getId() == second.getId();
    }

    private void validateSquadUpdatePreservesOwnership(UserSquadEntity persistedSquad, SquadDto submittedSquad) {
        if (persistedSquad == null || submittedSquad == null
                || submittedSquad.getStartingLineup() == null
                || submittedSquad.getBench() == null) {
            throw new FantasyTeamException("Squad data is incomplete");
        }

        List<Integer> submittedPlayers = submittedSquad.getStartingLineup().values().stream()
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        submittedSquad.getBench().values().stream()
                .filter(Objects::nonNull)
                .forEach(submittedPlayers::add);

        Set<Integer> submittedPlayerIds = new LinkedHashSet<>(submittedPlayers);
        if (submittedPlayerIds.size() != submittedPlayers.size()) {
            throw new FantasyTeamException("A player cannot occupy more than one squad slot");
        }

        Set<Integer> persistedPlayerIds = new LinkedHashSet<>(persistedSquad.getStartingLineup());
        persistedSquad.getBenchMap().values().stream()
                .filter(Objects::nonNull)
                .forEach(persistedPlayerIds::add);

        if (!persistedPlayerIds.equals(submittedPlayerIds)) {
            throw new FantasyTeamException(
                    "Saving a lineup may only rearrange players already owned by the squad"
            );
        }
        if (!Objects.equals(persistedSquad.getIrId(), submittedSquad.getIrId())) {
            throw new FantasyTeamException("The IR player can only be changed through the IR flow");
        }
        if (!Objects.equals(persistedSquad.getFirstPickId(), submittedSquad.getFirstPickId())) {
            throw new FantasyTeamException("The first-pick player cannot be changed while saving a lineup");
        }
    }

    private void saveSquadToDb(UserGameDataEntity gameDataEntity, FantasyTeam team) {
        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) throw new RuntimeException("Next squad entity structure missing");

        SquadMapper.updateEntity(nextSquadEntity, team.getSquad(), team.getGameweek());
        nextSquadEntity.setUser(gameDataEntity);
        userSquadRepo.save(nextSquadEntity);
    }

    private void saveGameDataChips(UserGameDataEntity entity, UserGameData domain) {
        entity.setChips(domain.getChips());
        entity.setActiveChips(domain.getActiveChips());
        gameDataRepo.save(entity);
    }

    private void publishLeagueNotification(UserGameDataEntity gameData,
                                           com.fantasy.domain.notification.NotificationEvent notification) {
        if (gameData.getLeague() == null) return;
        long leagueId = gameData.getLeague().getId();
        AfterCommitExecutor.run(() -> applicationEvents.publishEvent(
                LeagueNotificationRequestedEvent.leagueFrom(
                        leagueId,
                        gameData.getUser().getId(),
                        notification
                )
        ));
    }

}
