package com.fantasy.domain.player;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.realWorldData.TeamRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerGameweekStatsRepository statsRepo;
    private final TeamRepository teamRepo;
    private final FixtureRepository fixtureRepo;
    private final UserSquadRepository userSquadRepo;
    private final UserRepository userRepo;
    private final FixtureService fixtureService;
    private final PlayerRegistry playerRegistry;

    public PlayerService(PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         PlayerGameweekStatsRepository statsRepo,
                         TeamRepository teamRepo,
                         FixtureRepository fixtureRepo,
                         UserSquadRepository userSquadRepo,
                         UserRepository userRepo,
                         FixtureService fixtureService,
                         PlayerRegistry playerRegistry) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
        this.teamRepo = teamRepo;
        this.fixtureRepo = fixtureRepo;
        this.userSquadRepo = userSquadRepo;
        this.userRepo = userRepo;
        this.fixtureService = fixtureService;
        this.playerRegistry = playerRegistry;
    }


    public List<PlayerDto> getAllPlayers() {
        List<PlayerPointsEntity> allPoints = pointsRepo.findAll();
        Map<Integer, List<PlayerPointsEntity>> pointsByPlayer =
                allPoints.stream().collect(Collectors.groupingBy(p -> p.getPlayer().getId()));

        Map<Integer, String> ownerNameMap = userRepo.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getName));

        return playerRepo.findAll().stream()
                .map(p -> {
                    String ownerName = (p.getOwnerId() != null && p.getOwnerId() > 0)
                            ? ownerNameMap.get(p.getOwnerId()) : null;

                    return PlayerMapper.toDto(
                            p,
                            pointsByPlayer.getOrDefault(p.getId(), List.of()),
                            ownerName
                    );
                })
                .collect(Collectors.toList());
    }

    public long countPlayers() {
        return playerRepo.count();
    }

    public List<PlayerDto> getLockedPlayers() {
        List<PlayerEntity> locked = playerRepo.findByState(PlayerState.LOCKED);
        return locked.stream()
                .map(p -> PlayerMapper.toDto(p, null, null))
                .collect(Collectors.toList());
    }

    public List<PlayerAssistedDto> getPlayersAssistForGameWeek(int gwId){
        return statsRepo.findPlayersWithAssists(gwId);
    }

    public List<PlayerPenaltyDto> getPlayersPenaltiesForGameWeek(int gwId){
        return statsRepo.findPlayersWithPenalties(gwId);
    }


    public List<PlayerDataDto> getSquadDataForGameweek(int userId, int gwId) {
        UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(userId, gwId)
                .orElseThrow(() -> new RuntimeException("No squad found for user " + userId + " in GW " + gwId));

        List<FixtureEntity> gwFixtures = fixtureService.getFixturesByGameweek(gwId);

        Map<Integer, List<FixtureEntity>> teamFixturesMap = new HashMap<>();
        for (FixtureEntity f : gwFixtures) {
            teamFixturesMap.computeIfAbsent(f.getHomeTeamId(), k -> new ArrayList<>()).add(f);
            teamFixturesMap.computeIfAbsent(f.getAwayTeamId(), k -> new ArrayList<>()).add(f);
        }

        Map<Integer, String> teamNamesMap = teamRepo.findAll().stream()
                .collect(Collectors.toMap(
                        TeamEntity::getId,
                        t -> t.getShortName() != null ? t.getShortName() : t.getName()
                ));

        List<Integer> playerIds = new ArrayList<>();
        if (squadEntity.getStartingLineup() != null) playerIds.addAll(squadEntity.getStartingLineup());
        if (squadEntity.getBenchMap() != null) playerIds.addAll(squadEntity.getBenchMap().values());

        return playerIds.stream()
                .map(id -> mapPlayerToDataDto(id, gwId, teamFixturesMap, teamNamesMap))
                .toList();
    }

    private PlayerDataDto mapPlayerToDataDto(int playerId, int gwId,
                                             Map<Integer, List<FixtureEntity>> teamFixturesMap,
                                             Map<Integer, String> teamNamesMap) {

        Player player = playerRegistry.findById(playerId);
        if (player == null) return new PlayerDataDto(playerId, 0, null);

        List<FixtureEntity> myFixtures = teamFixturesMap.getOrDefault(player.getTeamId(), List.of());

        boolean hasStarted = myFixtures.stream().anyMatch(FixtureEntity::isStarted);

        Integer points = null;
        String nextFixture = null;

        if (hasStarted) {
            Optional<PlayerPointsEntity> pointsOpt = pointsRepo.findByPlayer_IdAndGameweek(playerId, gwId);

            if (pointsOpt.isPresent()) {
                points = pointsOpt.get().getPoints();
            } else {
                points = 0;
            }
        }

        if (points == null) {
            if (myFixtures.isEmpty()) {
                nextFixture = "Blank";
            } else {
                nextFixture = myFixtures.stream()
                        .map(f -> {
                            boolean isHome = f.getHomeTeamId() == player.getTeamId();
                            int opponentId = isHome ? f.getAwayTeamId() : f.getHomeTeamId();
                            String oppName = teamNamesMap.getOrDefault(opponentId, "UNK");
                            return oppName + (isHome ? " (H)" : " (A)");
                        })
                        .collect(Collectors.joining(", "));
            }
        }

        return new PlayerDataDto(playerId, points, nextFixture);
    }


    public List<PlayerMatchStatsDto> getAllMatchStats(int playerId) {
        Player player = playerRegistry.findById(playerId);
        if (player == null) throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Player's team not found for teamId: " + player.getTeamId()));

        var allStats = statsRepo.findByPlayer_Id(playerId);
        List<PlayerMatchStatsDto> results = new ArrayList<>();

        for (var e : allStats) {
            results.add(buildMatchStatsDto(player, e, playerTeam, e.getGameweek(), null));
        }
        return results;
    }

    public PlayerMatchStatsDto getMatchStats(int playerId, int gw, Integer userId) {
        Player player = playerRegistry.findById(playerId);
        if (player == null) throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found for player " + playerId));

        var statsOpt = statsRepo.findByPlayer_IdAndGameweek(playerId, gw);

        boolean isCaptain = false;
        if (userId != null) {
            var squadOpt = userSquadRepo.findByUser_IdAndGameweek(userId, gw);
            if (squadOpt.isPresent()) {
                Integer captainId = squadOpt.get().getCaptainId();
                if (captainId != null && captainId == playerId) {
                    isCaptain = true;
                }
            }
        }

        if (statsOpt.isPresent()) {
            return buildMatchStatsDto(player, statsOpt.get(), playerTeam, gw, isCaptain);
        }

        return buildEmptyMatchStats(player, gw, playerTeam);
    }

    private PlayerMatchStatsDto buildMatchStatsDto(Player player, PlayerGameweekStatsEntity stats, TeamEntity playerTeam, int gw, Boolean isCaptain) {
        TeamEntity opponent = teamRepo.findById(stats.getOpponentTeamId()).orElse(null);
        boolean wasHome = stats.isWasHome();

        TeamEntity homeTeam = wasHome ? playerTeam : opponent;
        TeamEntity awayTeam = wasHome ? opponent : playerTeam;

        Integer homeScore = null;
        Integer awayScore = null;

        var fixtureOpt = fixtureRepo.findByHomeTeamIdAndAwayTeamIdAndGameweekId(
                homeTeam != null ? homeTeam.getId() : -1,
                awayTeam != null ? awayTeam.getId() : -1, gw
        );

        if (fixtureOpt.isPresent()) {
            var fixture = fixtureOpt.get();
            homeScore = fixture.getHomeTeamScore();
            awayScore = fixture.getAwayTeamScore();
        }

        PlayerMatchStatsDto dto = PlayerMatchStatsMapper.toDto(player, stats, homeTeam, awayTeam, homeScore, awayScore, Boolean.TRUE.equals(isCaptain));

        if (homeTeam != null) {
            dto.setHomeTeamId(homeTeam.getId());
            dto.setHomeTeamName(homeTeam.getName());
        }
        if (awayTeam != null) {
            dto.setAwayTeamId(awayTeam.getId());
            dto.setAwayTeamName(awayTeam.getName());
        }

        return dto;
    }

    private PlayerMatchStatsDto buildEmptyMatchStats(Player player, int gw, TeamEntity playerTeam) {
        var fixtureOpt = fixtureRepo.findByGameweekAndTeam(gw, player.getTeamId());

        if (fixtureOpt.isPresent()) {
            var f = fixtureOpt.get();
            TeamEntity opponent;
            boolean wasHome;

            if (f.getHomeTeamId() == player.getTeamId()) {
                opponent = teamRepo.findById(f.getAwayTeamId()).orElse(null);
                wasHome = true;
            } else {
                opponent = teamRepo.findById(f.getHomeTeamId()).orElse(null);
                wasHome = false;
            }

            TeamEntity homeTeam = wasHome ? playerTeam : opponent;
            TeamEntity awayTeam = wasHome ? opponent : playerTeam;

            PlayerMatchStatsDto dto = PlayerMatchStatsDto.empty(
                    player,
                    homeTeam,
                    awayTeam,
                    f.getHomeTeamScore(),
                    f.getAwayTeamScore()
            );

            if (homeTeam != null) {
                dto.setHomeTeamId(homeTeam.getId());
                dto.setHomeTeamName(homeTeam.getName());
            }
            if (awayTeam != null) {
                dto.setAwayTeamId(awayTeam.getId());
                dto.setAwayTeamName(awayTeam.getName());
            }

            if (f.getHomeTeamScore() != null) {
                List<PlayerMatchStatsDto.StatLine> zeroStats = new ArrayList<>();
                zeroStats.add(new PlayerMatchStatsDto.StatLine("Minutes played", "0", 0));
                zeroStats.add(new PlayerMatchStatsDto.StatLine("Total", "0", 0));
                dto.setStats(zeroStats);
            }

            return dto;
        }

        return PlayerMatchStatsDto.empty(player, null, null, null, null);
    }
}