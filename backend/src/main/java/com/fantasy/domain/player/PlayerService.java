package com.fantasy.domain.player;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.realWorldData.TeamRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.score.LeagueScoringService;
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
    private final FixtureService fixtureService;
    private final LeagueRepository leagueRepo;
    private final UserGameDataRepository gameDataRepo;
    private final LeagueScoringService leagueScoringService;

    public PlayerService(PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         PlayerGameweekStatsRepository statsRepo,
                         TeamRepository teamRepo,
                         FixtureRepository fixtureRepo,
                         UserSquadRepository userSquadRepo,
                         FixtureService fixtureService,
                         LeagueRepository leagueRepo,
                         UserGameDataRepository gameDataRepo,
                         LeagueScoringService leagueScoringService) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
        this.teamRepo = teamRepo;
        this.fixtureRepo = fixtureRepo;
        this.userSquadRepo = userSquadRepo;
        this.fixtureService = fixtureService;
        this.leagueRepo = leagueRepo;
        this.gameDataRepo = gameDataRepo;
        this.leagueScoringService = leagueScoringService;
    }


    public List<PlayerDto> getAllPlayers(Integer requestingUserId) {
        List<PlayerPointsEntity> allPoints = pointsRepo.findAll();
        Map<Integer, List<PlayerPointsEntity>> pointsByPlayer =
                allPoints.stream().collect(Collectors.groupingBy(p -> p.getPlayer().getId()));

        Map<Integer, PlayerOwnership> ownershipByPlayer = loadLeagueOwnership(requestingUserId);
        LeagueEntity scoringLeague = requestingUserId == null
                ? null
                : leagueRepo.findFirstByUsers_Id(requestingUserId).orElse(null);
        Map<Integer, Integer> leaguePointsByPlayer = new HashMap<>();
        if (scoringLeague != null) {
            for (PlayerGameweekStatsEntity stats : statsRepo.findAll()) {
                leaguePointsByPlayer.merge(
                        stats.getPlayer().getId(),
                        leagueScoringService.calculatePlayerPoints(stats, scoringLeague),
                        Integer::sum
                );
            }
        }

        return playerRepo.findAll().stream()
                .map(p -> {
                    PlayerOwnership ownership = ownershipByPlayer.get(p.getId());
                    Integer ownerId = ownership != null ? ownership.userId() : null;
                    String ownerName = ownership != null ? ownership.userName() : null;
                    PlayerPosition effectivePosition = scoringLeague == null
                            ? p.getPosition()
                            : scoringLeague.effectivePosition(p);
                    boolean locked = scoringLeague == null
                            ? false
                            : scoringLeague.isPlayerLocked(p.getId());
                    boolean available = ownerId == null && !locked;

                    if (scoringLeague != null) {
                        return PlayerMapper.toDtoWithTotalPoints(
                                p,
                                leaguePointsByPlayer.getOrDefault(p.getId(), 0),
                                ownerId,
                                ownerName,
                                available,
                                effectivePosition
                        );
                    }
                    return PlayerMapper.toDto(
                                p,
                                pointsByPlayer.getOrDefault(p.getId(), List.of()),
                                ownerId,
                                ownerName,
                                available,
                                effectivePosition
                        );
                })
                .collect(Collectors.toList());
    }

    private Map<Integer, PlayerOwnership> loadLeagueOwnership(Integer requestingUserId) {
        if (requestingUserId == null) {
            return Map.of();
        }

        return leagueRepo.findFirstByUsers_Id(requestingUserId)
                .map(league -> {
                    Map<Integer, PlayerOwnership> ownership = new HashMap<>();
                    for (UserGameDataEntity gameData : gameDataRepo.findAllByLeagueIdWithSquads(league.getId())) {
                        UserSquadEntity squad = gameData.getNextSquad() != null
                                ? gameData.getNextSquad()
                                : gameData.getCurrentSquad();
                        if (squad == null) continue;

                        PlayerOwnership owner = new PlayerOwnership(
                                gameData.getUser().getId(),
                                gameData.getUser().getName()
                        );
                        addOwnership(ownership, squad.getStartingLineup(), owner);
                        addOwnership(ownership, squad.getBenchMap().values(), owner);
                        if (squad.getIrId() != null) {
                            ownership.put(squad.getIrId(), owner);
                        }
                    }
                    return ownership;
                })
                .orElseGet(Map::of);
    }

    private void addOwnership(Map<Integer, PlayerOwnership> ownership,
                              Collection<Integer> playerIds,
                              PlayerOwnership owner) {
        if (playerIds == null) return;
        for (Integer playerId : playerIds) {
            if (playerId != null) ownership.put(playerId, owner);
        }
    }

    private record PlayerOwnership(Integer userId, String userName) {}

    public long countPlayers() {
        return playerRepo.count();
    }

    public List<PlayerDataDto> getSquadDataForGameweek(int userId, int gwId) {
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No game data found for user " + userId));
        int gameDataId = gameData.getId();
        UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(gameDataId, gwId)
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
                .map(id -> mapPlayerToDataDto(id, gwId, teamFixturesMap, teamNamesMap, gameData.getLeague()))
                .toList();
    }

    private PlayerDataDto mapPlayerToDataDto(int playerId, int gwId,
                                             Map<Integer, List<FixtureEntity>> teamFixturesMap,
                                             Map<Integer, String> teamNamesMap,
                                             LeagueEntity scoringLeague) {

        Player player = loadDomainPlayer(playerId);
        if (player == null) return new PlayerDataDto(playerId, 0, null);

        List<FixtureEntity> myFixtures = teamFixturesMap.getOrDefault(player.getTeamId(), List.of());

        boolean hasStarted = myFixtures.stream().anyMatch(FixtureEntity::isStarted);

        Integer points = null;
        String nextFixture = null;

        if (hasStarted) {
            Optional<PlayerPointsEntity> pointsOpt = pointsRepo.findByPlayer_IdAndGameweek(playerId, gwId);
            points = statsRepo.findByPlayer_IdAndGameweek(playerId, gwId)
                    .map(stats -> leagueScoringService.calculatePlayerPoints(stats, scoringLeague))
                    .orElseGet(() -> pointsOpt.map(PlayerPointsEntity::getPoints).orElse(0));
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
        Player player = loadDomainPlayer(playerId);
        if (player == null) throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Player's team not found for teamId: " + player.getTeamId()));

        var allStats = statsRepo.findByPlayer_Id(playerId);
        List<PlayerMatchStatsDto> results = new ArrayList<>();

        for (var e : allStats) {
            results.add(buildMatchStatsDto(player, e, playerTeam, e.getGameweek(), null, null));
        }
        return results;
    }

    public PlayerMatchStatsDto getMatchStats(int playerId, int gw, Integer userId) {
        Player player = loadDomainPlayer(playerId);
        if (player == null) throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found for player " + playerId));

        var statsOpt = statsRepo.findByPlayer_IdAndGameweek(playerId, gw);

        boolean isCaptain = false;
        LeagueEntity scoringLeague = null;
        if (userId != null) {
            UserGameDataEntity gameData = gameDataRepo.findByUserId(userId).orElse(null);
            var squadOpt = gameData == null
                    ? Optional.<UserSquadEntity>empty()
                    : userSquadRepo.findByUser_IdAndGameweek(gameData.getId(), gw);
            scoringLeague = gameData != null ? gameData.getLeague() : null;
            if (squadOpt.isPresent()) {
                Integer captainId = squadOpt.get().getCaptainId();
                if (captainId != null && captainId == playerId) {
                    isCaptain = true;
                }
            }
        }

        if (statsOpt.isPresent()) {
            return buildMatchStatsDto(player, statsOpt.get(), playerTeam, gw, isCaptain, scoringLeague);
        }

        return buildEmptyMatchStats(player, gw, playerTeam);
    }

    private PlayerMatchStatsDto buildMatchStatsDto(Player player,
                                                    PlayerGameweekStatsEntity stats,
                                                    TeamEntity playerTeam,
                                                    int gw,
                                                    Boolean isCaptain,
                                                    LeagueEntity scoringLeague) {
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

        var scoreBreakdown = leagueScoringService.calculatePlayerScore(stats, scoringLeague);
        Player effectivePlayer = player;
        if (scoringLeague != null) {
            PlayerPosition effectivePosition = scoringLeague.getPlayerPositionOverrides()
                    .getOrDefault(player.getId(), player.getPosition());
            effectivePlayer = new Player(
                    player.getId(),
                    player.getFirstName(),
                    player.getLastName(),
                    effectivePosition,
                    player.getTeamId(),
                    player.getViewName()
            );
        }
        PlayerMatchStatsDto dto = PlayerMatchStatsMapper.toDto(
                effectivePlayer,
                stats,
                homeTeam,
                awayTeam,
                homeScore,
                awayScore,
                Boolean.TRUE.equals(isCaptain),
                scoreBreakdown
        );

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

    private Player loadDomainPlayer(int playerId) {
        return playerRepo.findById(playerId)
                .map(entity -> PlayerMapper.toDomain(entity, pointsRepo.findByPlayer_Id(playerId)))
                .orElse(null);
    }
}
