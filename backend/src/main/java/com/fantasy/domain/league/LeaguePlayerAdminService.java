package com.fantasy.domain.league;

import com.fantasy.domain.player.PlayerAssistedDto;
import com.fantasy.domain.player.PlayerDto;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerGameweekStatsRepository;
import com.fantasy.domain.player.PlayerMapper;
import com.fantasy.domain.player.PlayerPenaltyDto;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.player.UpdateAssistRequest;
import com.fantasy.domain.player.UpdatePositionRequest;
import com.fantasy.domain.player.UpdatePenaltyRequest;
import com.fantasy.domain.score.PointsService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class LeaguePlayerAdminService {

    private final LeagueAccessService leagueAccessService;
    private final LeagueRepository leagueRepository;
    private final PlayerRepository playerRepository;
    private final PlayerGameweekStatsRepository statsRepository;
    private final UserGameDataRepository gameDataRepository;
    private final UserSquadRepository squadRepository;
    private final PointsService pointsService;

    public LeaguePlayerAdminService(LeagueAccessService leagueAccessService,
                                    LeagueRepository leagueRepository,
                                    PlayerRepository playerRepository,
                                    PlayerGameweekStatsRepository statsRepository,
                                    UserGameDataRepository gameDataRepository,
                                    UserSquadRepository squadRepository,
                                    PointsService pointsService) {
        this.leagueAccessService = leagueAccessService;
        this.leagueRepository = leagueRepository;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.gameDataRepository = gameDataRepository;
        this.squadRepository = squadRepository;
        this.pointsService = pointsService;
    }

    @Transactional(readOnly = true)
    public List<PlayerAssistedDto> getAssists(int actingUserId, int gameweek) {
        LeagueEntity league = requireManagedLeague(actingUserId, false);
        return getAssists(league, gameweek);
    }

    @Transactional(readOnly = true)
    public List<PlayerAssistedDto> getAssistsForLeague(long leagueId, int gameweek) {
        return getAssists(requireLeague(leagueId, false), gameweek);
    }

    private List<PlayerAssistedDto> getAssists(LeagueEntity league, int gameweek) {
        return statsRepository.findByGameweek(gameweek).stream()
                .map(stats -> toAssistDto(league, stats))
                .filter(dto -> dto.getNumOfAssist() > 0)
                .sorted(Comparator.comparing(PlayerAssistedDto::getViewName))
                .toList();
    }

    @Transactional
    public PlayerAssistedDto updateAssist(int actingUserId, UpdateAssistRequest request) {
        LeagueEntity league = requireManagedLeague(actingUserId, true);
        return updateAssist(league, request);
    }

    @Transactional
    public PlayerAssistedDto updateAssistForLeague(long leagueId, UpdateAssistRequest request) {
        return updateAssist(requireLeague(leagueId, true), request);
    }

    private PlayerAssistedDto updateAssist(LeagueEntity league, UpdateAssistRequest request) {
        PlayerGameweekStatsEntity stats = statsRepository
                .findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .orElseThrow(() -> new IllegalArgumentException("Stats were not found"));
        int delta = actionDelta(request.getAction());
        league.adjustAssists(stats.getPlayer().getId(), stats.getGameweek(), stats.getAssists(), delta);
        leagueRepository.saveAndFlush(league);
        recalculateLeaguePoints(league.getId(), request.getGameweek());
        return toAssistDto(league, stats);
    }

    @Transactional(readOnly = true)
    public List<PlayerPenaltyDto> getPenalties(int actingUserId, int gameweek) {
        LeagueEntity league = requireManagedLeague(actingUserId, false);
        return getPenalties(league, gameweek);
    }

    @Transactional(readOnly = true)
    public List<PlayerPenaltyDto> getPenaltiesForLeague(long leagueId, int gameweek) {
        return getPenalties(requireLeague(leagueId, false), gameweek);
    }

    private List<PlayerPenaltyDto> getPenalties(LeagueEntity league, int gameweek) {
        return statsRepository.findByGameweek(gameweek).stream()
                .map(stats -> toPenaltyDto(league, stats))
                .filter(dto -> dto.getPenaltiesConceded() > 0)
                .sorted(Comparator.comparing(PlayerPenaltyDto::getViewName))
                .toList();
    }

    @Transactional
    public PlayerPenaltyDto updatePenalty(int actingUserId, UpdatePenaltyRequest request) {
        LeagueEntity league = requireManagedLeague(actingUserId, true);
        return updatePenalty(league, request);
    }

    @Transactional
    public PlayerPenaltyDto updatePenaltyForLeague(long leagueId, UpdatePenaltyRequest request) {
        return updatePenalty(requireLeague(leagueId, true), request);
    }

    private PlayerPenaltyDto updatePenalty(LeagueEntity league, UpdatePenaltyRequest request) {
        PlayerGameweekStatsEntity stats = statsRepository
                .findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .orElseThrow(() -> new IllegalArgumentException("Stats were not found"));
        int delta = actionDelta(request.getAction());
        league.adjustPenaltiesConceded(
                stats.getPlayer().getId(),
                stats.getGameweek(),
                stats.getPenaltiesConceded(),
                delta
        );
        leagueRepository.saveAndFlush(league);
        recalculateLeaguePoints(league.getId(), request.getGameweek());
        return toPenaltyDto(league, stats);
    }

    @Transactional(readOnly = true)
    public List<PlayerDto> getLockedPlayers(int actingUserId) {
        LeagueEntity league = requireManagedLeague(actingUserId, false);
        return getLockedPlayers(league);
    }

    @Transactional(readOnly = true)
    public List<PlayerDto> getLockedPlayersForLeague(long leagueId) {
        return getLockedPlayers(requireLeague(leagueId, false));
    }

    private List<PlayerDto> getLockedPlayers(LeagueEntity league) {
        return playerRepository.findAllById(league.getLockedPlayerIds()).stream()
                .sorted(Comparator.comparing(PlayerEntity::getViewName))
                .map(player -> PlayerMapper.toDto(
                        player,
                        null,
                        null,
                        null,
                        false,
                        league.effectivePosition(player)
                ))
                .toList();
    }

    @Transactional
    public PlayerDto setPlayerLocked(int actingUserId, int playerId, boolean locked) {
        LeagueEntity league = requireManagedLeague(actingUserId, true);
        return setPlayerLocked(league, playerId, locked);
    }

    @Transactional
    public PlayerDto setPlayerLockedForLeague(long leagueId, int playerId, boolean locked) {
        return setPlayerLocked(requireLeague(leagueId, true), playerId, locked);
    }

    private PlayerDto setPlayerLocked(LeagueEntity league, int playerId, boolean locked) {
        PlayerEntity player = requirePlayer(playerId);
        if (locked && isOwnedInLeague(league.getId(), playerId)) {
            throw new IllegalStateException("An owned player cannot be locked");
        }
        league.setPlayerLocked(playerId, locked);
        leagueRepository.save(league);
        return PlayerMapper.toDto(
                player,
                null,
                null,
                null,
                !locked,
                league.effectivePosition(player)
        );
    }

    @Transactional
    public void updatePlayerPosition(int actingUserId, UpdatePositionRequest request) {
        LeagueEntity league = requireManagedLeague(actingUserId, true);
        updatePlayerPosition(league, request);
    }

    @Transactional
    public void updatePlayerPositionForLeague(long leagueId, UpdatePositionRequest request) {
        updatePlayerPosition(requireLeague(leagueId, true), request);
    }

    private void updatePlayerPosition(LeagueEntity league, UpdatePositionRequest request) {
        PlayerEntity player = requirePlayer(request.getPlayerId());
        if (isOwnedInLeague(league.getId(), player.getId())) {
            throw new IllegalStateException("The position of an owned player cannot be changed");
        }
        PlayerPosition position = PlayerPosition.fromId(request.getPositionId());
        league.setPlayerPosition(player, position);
        leagueRepository.save(league);
    }

    private LeagueEntity requireManagedLeague(int actingUserId, boolean lock) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(actingUserId);
        leagueAccessService.requireLeagueAdmin(actingUserId, leagueId);
        return requireLeague(leagueId, lock);
    }

    private LeagueEntity requireLeague(long leagueId, boolean lock) {
        return (lock ? leagueRepository.findByIdWithLock(leagueId) : leagueRepository.findById(leagueId))
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
    }

    private PlayerEntity requirePlayer(int playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player was not found"));
    }

    private int actionDelta(String action) {
        if ("ADD".equalsIgnoreCase(action)) return 1;
        if ("REMOVE".equalsIgnoreCase(action)) return -1;
        throw new IllegalArgumentException("Action must be ADD or REMOVE");
    }

    private PlayerAssistedDto toAssistDto(LeagueEntity league, PlayerGameweekStatsEntity stats) {
        PlayerEntity player = stats.getPlayer();
        return new PlayerAssistedDto(
                player.getId(),
                player.getViewName(),
                league.effectiveAssists(player.getId(), stats.getGameweek(), stats.getAssists()),
                player.getTeamId()
        );
    }

    private PlayerPenaltyDto toPenaltyDto(LeagueEntity league, PlayerGameweekStatsEntity stats) {
        PlayerEntity player = stats.getPlayer();
        return new PlayerPenaltyDto(
                player.getId(),
                player.getViewName(),
                league.effectivePenaltiesConceded(
                        player.getId(),
                        stats.getGameweek(),
                        stats.getPenaltiesConceded()
                ),
                player.getTeamId()
        );
    }

    private boolean isOwnedInLeague(long leagueId, int playerId) {
        return gameDataRepository.findAllByLeagueIdWithSquads(leagueId).stream()
                .map(data -> data.getNextSquad() != null ? data.getNextSquad() : data.getCurrentSquad())
                .filter(Objects::nonNull)
                .anyMatch(squad -> containsPlayer(squad, playerId));
    }

    private boolean containsPlayer(UserSquadEntity squad, int playerId) {
        return squad.getStartingLineup().contains(playerId)
                || squad.getBenchMap().containsValue(playerId)
                || Objects.equals(squad.getIrId(), playerId);
    }

    private void recalculateLeaguePoints(long leagueId, int gameweek) {
        for (UserGameDataEntity gameData : gameDataRepository.findByLeague_Id(leagueId)) {
            if (gameData.getUser() != null
                    && squadRepository.findByUser_IdAndGameweek(gameData.getId(), gameweek).isPresent()) {
                pointsService.calculateAndPersist(gameData.getUser().getId(), gameweek);
            }
        }
    }
}
