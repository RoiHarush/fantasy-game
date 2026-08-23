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
import com.fantasy.domain.score.PlayerScoreBreakdown;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.LeagueTransferWindowEntity;
import com.fantasy.domain.transfer.SupplementalDraftPoolService;
import com.fantasy.domain.transfer.TransferWindowStatus;
import com.fantasy.domain.transfer.TransferWindowType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerGameweekStatsRepository statsRepo;
    private final PlayerFixtureStatsRepository fixtureStatsRepo;
    private final TeamRepository teamRepo;
    private final FixtureRepository fixtureRepo;
    private final UserSquadRepository userSquadRepo;
    private final FixtureService fixtureService;
    private final LeagueRepository leagueRepo;
    private final UserGameDataRepository gameDataRepo;
    private final LeagueScoringService leagueScoringService;
    private final SupplementalDraftPoolService supplementalDraftPoolService;
    private final LeagueTransferWindowRepository transferWindowRepository;

    public PlayerService(PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         PlayerGameweekStatsRepository statsRepo,
                         PlayerFixtureStatsRepository fixtureStatsRepo,
                         TeamRepository teamRepo,
                         FixtureRepository fixtureRepo,
                         UserSquadRepository userSquadRepo,
                         FixtureService fixtureService,
                         LeagueRepository leagueRepo,
                         UserGameDataRepository gameDataRepo,
                         LeagueScoringService leagueScoringService,
                         SupplementalDraftPoolService supplementalDraftPoolService,
                         LeagueTransferWindowRepository transferWindowRepository) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
        this.fixtureStatsRepo = fixtureStatsRepo;
        this.teamRepo = teamRepo;
        this.fixtureRepo = fixtureRepo;
        this.userSquadRepo = userSquadRepo;
        this.fixtureService = fixtureService;
        this.leagueRepo = leagueRepo;
        this.gameDataRepo = gameDataRepo;
        this.leagueScoringService = leagueScoringService;
        this.supplementalDraftPoolService = supplementalDraftPoolService;
        this.transferWindowRepository = transferWindowRepository;
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
        var activeWindow = scoringLeague == null
                ? Optional.<LeagueTransferWindowEntity>empty()
                : transferWindowRepository.findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(
                        scoringLeague.getId(),
                        TransferWindowStatus.OPEN
                );
        boolean supplementalDraftOpen = activeWindow
                .map(window -> window.getWindowType() == TransferWindowType.SUPPLEMENTAL)
                .orElse(false);
        Set<Integer> supplementalPlayerIds = scoringLeague == null
                ? Set.of()
                : Optional.ofNullable(supplementalDraftPoolService.playerIds(scoringLeague.getId()))
                    .orElseGet(Set::of);
        Set<Integer> currentSupplementalDraftPlayerIds = scoringLeague == null || !supplementalDraftOpen
                ? Set.of()
                : supplementalDraftPoolService.playerIdsEligibleAt(
                        scoringLeague.getId(),
                        activeWindow.orElseThrow().getOpenedAt()
                );
        if (scoringLeague != null) {
            Map<Integer, Map<Integer, List<PlayerFixtureStatsEntity>>> fixtureStatsByPlayerAndGameweek =
                    fixtureStatsRepo.findAll().stream().collect(Collectors.groupingBy(
                            stats -> stats.getPlayer().getId(),
                            Collectors.groupingBy(PlayerFixtureStatsEntity::getGameweek)
                    ));
            for (PlayerGameweekStatsEntity stats : statsRepo.findAll()) {
                leaguePointsByPlayer.merge(
                        stats.getPlayer().getId(),
                        leagueScoringService.calculatePlayerGameweekPoints(
                                stats,
                                fixtureStatsByPlayerAndGameweek
                                        .getOrDefault(stats.getPlayer().getId(), Map.of())
                                        .getOrDefault(stats.getGameweek(), List.of()),
                                scoringLeague
                        ),
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
                    boolean supplementalEligible = supplementalPlayerIds.contains(p.getId());
                    boolean supplementalSelectable = currentSupplementalDraftPlayerIds.contains(p.getId());
                    boolean available = ownerId == null
                            && !locked
                            && (!supplementalEligible || supplementalSelectable);

                    if (scoringLeague != null) {
                        PlayerDto dto = PlayerMapper.toDtoWithTotalPoints(
                                p,
                                leaguePointsByPlayer.getOrDefault(p.getId(), 0),
                                ownerId,
                                ownerName,
                                available,
                                effectivePosition
                        );
                        dto.setSupplementalDraftEligible(supplementalEligible);
                        dto.setSupplementalDraftSelectable(supplementalSelectable);
                        return dto;
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
                                gameData.getUser().getFullName()
                        );
                        addOwnership(ownership, squad.getStartingLineup(), owner);
                        addOwnership(ownership, squad.getBenchMap().values(), owner);
                        if (squad.getIrId() != null) {
                            addOwnership(ownership, List.of(squad.getIrId()), owner);
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
            if (playerId == null) continue;
            PlayerOwnership previous = ownership.putIfAbsent(playerId, owner);
            if (previous != null) {
                throw new IllegalStateException(
                        "Player " + playerId + " is assigned to more than one league squad slot"
                );
            }
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
        Set<Integer> postponedTeamIds = Optional
                .ofNullable(fixtureService.getPostponedTeamIdsForGameweek(gwId))
                .orElseGet(Set::of);

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

        Set<Integer> leagueLeaderIds = findLeagueGameweekLeader(gameData.getLeague(), gwId)
                .map(leader -> Set.of(leader.playerId()))
                .orElseGet(Set::of);

        return playerIds.stream()
                .filter(Objects::nonNull)
                .map(id -> mapPlayerToDataDto(
                        id,
                        gwId,
                        teamFixturesMap,
                        teamNamesMap,
                        postponedTeamIds,
                        gameData.getLeague(),
                        leagueLeaderIds
                ))
                .toList();
    }

    public List<PlayerOfTheWeekDto> getPlayersOfTheWeek(int userId, int currentGameweekId) {
        LeagueEntity league = gameDataRepo.findByUserId(userId)
                .map(UserGameDataEntity::getLeague)
                .orElseThrow(() -> new IllegalArgumentException("No league found for user " + userId));

        List<PlayerOfTheWeekDto> result = new ArrayList<>();
        for (int gameweekId = 1; gameweekId <= currentGameweekId; gameweekId++) {
            int resolvedGameweekId = gameweekId;
            findLeagueGameweekLeader(league, resolvedGameweekId).ifPresent(leader -> {
                PlayerEntity player = playerRepo.findById(leader.playerId()).orElse(null);
                if (player != null) {
                    result.add(new PlayerOfTheWeekDto(
                            player.getId(),
                            resolvedGameweekId,
                            player.getViewName(),
                            player.getTeamId(),
                            leader.contributionPoints(),
                            player.getPhoto(),
                            player.getPosition().getCode()
                    ));
                }
            });
        }
        return result;
    }

    private Optional<LeagueGameweekLeaderResolver.Leader> findLeagueGameweekLeader(
            LeagueEntity league,
            int gameweekId) {
        if (league == null || league.getId() == null) return Optional.empty();

        List<UserSquadEntity> leagueSquads = Optional
                .ofNullable(userSquadRepo.findByGameweek(gameweekId))
                .orElseGet(List::of)
                .stream()
                .filter(squad -> squad.getUser() != null
                        && squad.getUser().getLeague() != null
                        && Objects.equals(squad.getUser().getLeague().getId(), league.getId()))
                .sorted(Comparator.comparing(
                        squad -> squad.getUser().getId(),
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();
        if (leagueSquads.isEmpty()) return Optional.empty();

        Map<Integer, PlayerGameweekStatsEntity> statsByPlayer = Optional
                .ofNullable(statsRepo.findByGameweek(gameweekId))
                .orElseGet(List::of)
                .stream()
                .collect(Collectors.toMap(
                        stats -> stats.getPlayer().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));
        Map<Integer, List<PlayerFixtureStatsEntity>> fixtureStatsByPlayer = Optional
                .ofNullable(fixtureStatsRepo.findByGameweek(gameweekId))
                .orElseGet(List::of)
                .stream()
                .collect(Collectors.groupingBy(stats -> stats.getPlayer().getId()));

        Set<Integer> candidatePlayerIds = leagueSquads.stream()
                .flatMap(squad -> LeagueGameweekLeaderResolver.orderedPlayerIds(squad).stream())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Map<Integer, Integer> pointsByPlayer = new HashMap<>();
        Map<Integer, LeagueGameweekLeaderResolver.PerformanceTieBreak> tieBreakByPlayer = new HashMap<>();
        for (Integer playerId : candidatePlayerIds) {
            PlayerGameweekStatsEntity stats = statsByPlayer.get(playerId);
            PlayerScoreBreakdown score = stats == null
                    ? null
                    : leagueScoringService.calculatePlayerGameweekScore(
                            stats,
                            fixtureStatsByPlayer.getOrDefault(playerId, List.of()),
                            league
                    );
            int points = score == null
                    ? pointsRepo.findByPlayer_IdAndGameweek(playerId, gameweekId)
                            .map(PlayerPointsEntity::getPoints)
                            .orElse(0)
                    : score.totalPoints();
            pointsByPlayer.put(playerId, points);
            if (stats != null && score != null) {
                int positiveImpactPoints = score.lines().stream()
                        .filter(line -> !"Minutes played".equals(line.label()))
                        .mapToInt(line -> Math.max(0, line.points()))
                        .sum();
                int goalImpactPoints = pointsForLabels(score, "Goals", "Forward bonus");
                int penaltySaveImpactPoints = pointsForLabels(score, "Penalties saved");
                int cleanSheetImpactPoints = pointsForLabels(score, "Clean sheets");
                int assistImpactPoints = pointsForLabels(score, "Assists");
                int negativeImpactPoints = score.lines().stream()
                        .mapToInt(line -> Math.max(0, -line.points()))
                        .sum();
                tieBreakByPlayer.put(
                        playerId,
                        new LeagueGameweekLeaderResolver.PerformanceTieBreak(
                                points,
                                positiveImpactPoints,
                                goalImpactPoints,
                                penaltySaveImpactPoints,
                                cleanSheetImpactPoints,
                                assistImpactPoints,
                                stats.getMinutesPlayed(),
                                negativeImpactPoints
                        )
                );
            }
        }

        return LeagueGameweekLeaderResolver.resolve(
                leagueSquads,
                pointsByPlayer,
                tieBreakByPlayer
        );
    }

    private int pointsForLabels(PlayerScoreBreakdown score, String... labels) {
        Set<String> includedLabels = Set.of(labels);
        return score.lines().stream()
                .filter(line -> includedLabels.contains(line.label()))
                .mapToInt(line -> Math.max(0, line.points()))
                .sum();
    }

    private PlayerDataDto mapPlayerToDataDto(int playerId, int gwId,
                                             Map<Integer, List<FixtureEntity>> teamFixturesMap,
                                             Map<Integer, String> teamNamesMap,
                                             Set<Integer> postponedTeamIds,
                                             LeagueEntity scoringLeague,
                                             Set<Integer> leagueLeaderIds) {

        Player player = loadDomainPlayer(playerId);
        if (player == null) return new PlayerDataDto(playerId, 0, null);

        List<FixtureEntity> myFixtures = teamFixturesMap.getOrDefault(player.getTeamId(), List.of());

        boolean hasStarted = myFixtures.stream().anyMatch(FixtureEntity::isStarted);

        Integer points = null;
        List<String> nextFixtures = List.of();
        boolean fixturePostponed = false;

        if (hasStarted) {
            Optional<PlayerPointsEntity> pointsOpt = pointsRepo.findByPlayer_IdAndGameweek(playerId, gwId);
            points = statsRepo.findByPlayer_IdAndGameweek(playerId, gwId)
                    .map(stats -> leagueScoringService.calculatePlayerGameweekPoints(
                            stats,
                            fixtureStatsRepo.findByPlayer_IdAndGameweekOrderByFixture_KickoffTime(playerId, gwId),
                            scoringLeague
                    ))
                    .orElseGet(() -> pointsOpt.map(PlayerPointsEntity::getPoints).orElse(0));
        }

        if (points == null) {
            fixturePostponed = postponedTeamIds.contains(player.getTeamId());
            if (fixturePostponed) {
                nextFixtures = List.of();
            } else if (myFixtures.isEmpty()) {
                nextFixtures = List.of("Blank");
            } else {
                nextFixtures = myFixtures.stream()
                        .sorted(Comparator.comparing(
                                FixtureEntity::getKickoffTime,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        ))
                        .map(f -> {
                            boolean isHome = f.getHomeTeamId() == player.getTeamId();
                            int opponentId = isHome ? f.getAwayTeamId() : f.getHomeTeamId();
                            String oppName = teamNamesMap.getOrDefault(opponentId, "UNK");
                            return oppName + (isHome ? " (H)" : " (A)");
                        })
                        .toList();
            }
        }

        return new PlayerDataDto(
                playerId,
                points,
                nextFixtures,
                fixturePostponed,
                leagueLeaderIds.contains(playerId)
        );
    }


    public List<PlayerMatchStatsDto> getAllMatchStats(int playerId) {
        Player player = loadDomainPlayer(playerId);
        if (player == null) throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Player's team not found for teamId: " + player.getTeamId()));

        var allStats = statsRepo.findByPlayer_Id(playerId);
        List<PlayerMatchStatsDto> results = new ArrayList<>();

        for (var e : allStats) {
            var fixtureStats = fixtureStatsRepo.findByPlayer_IdAndGameweekOrderByFixture_KickoffTime(
                    playerId,
                    e.getGameweek()
            );
            results.add(buildMatchStatsDto(player, e, fixtureStats, playerTeam, e.getGameweek(), 1, null));
        }
        return results;
    }

    public PlayerMatchStatsDto getMatchStats(int playerId, int gw, Integer userId) {
        Player player = loadDomainPlayer(playerId);
        if (player == null) throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found for player " + playerId));

        var statsOpt = statsRepo.findByPlayer_IdAndGameweek(playerId, gw);

        int captainMultiplier = 1;
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
                    captainMultiplier = squadOpt.get().isTripleCaptainActive() ? 3 : 2;
                }
            }
        }

        if (statsOpt.isPresent()) {
            var fixtureStats = fixtureStatsRepo.findByPlayer_IdAndGameweekOrderByFixture_KickoffTime(playerId, gw);
            return buildMatchStatsDto(
                    player,
                    statsOpt.get(),
                    fixtureStats,
                    playerTeam,
                    gw,
                    captainMultiplier,
                    scoringLeague
            );
        }

        return buildEmptyMatchStats(player, gw, playerTeam);
    }

    private PlayerMatchStatsDto buildMatchStatsDto(Player player,
                                                    PlayerGameweekStatsEntity stats,
                                                    List<PlayerFixtureStatsEntity> fixtureStats,
                                                    TeamEntity playerTeam,
                                                    int gw,
                                                    int captainMultiplier,
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

        var scoreBreakdown = leagueScoringService.calculatePlayerGameweekScore(stats, fixtureStats, scoringLeague);
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
                captainMultiplier > 1,
                scoreBreakdown
        );
        dto.setCaptainMultiplier(captainMultiplier);
        Player renderedPlayer = effectivePlayer;
        Map<Integer, PlayerFixtureStatsEntity> statsByFixture = fixtureStats.stream()
                .collect(Collectors.toMap(
                        fixtureStat -> fixtureStat.getFixture().getId(),
                        Function.identity(),
                        (left, right) -> right
                ));
        List<FixtureEntity> scheduledFixtures = fixtureRepo.findAllByGameweekAndTeam(gw, player.getTeamId());
        if (scheduledFixtures.isEmpty()) {
            dto.setFixtures(fixtureStats.stream()
                    .map(fixtureStat -> buildFixtureMatchStatsDto(
                            renderedPlayer,
                            fixtureStat,
                            playerTeam,
                            scoringLeague
                    ))
                    .toList());
        } else {
            dto.setFixtures(scheduledFixtures.stream()
                    .map(fixture -> {
                        PlayerFixtureStatsEntity fixtureStat = statsByFixture.get(fixture.getId());
                        return fixtureStat == null
                                ? buildEmptyFixtureMatchStatsDto(renderedPlayer, fixture)
                                : buildFixtureMatchStatsDto(renderedPlayer, fixtureStat, playerTeam, scoringLeague);
                    })
                    .toList());
        }

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

    private PlayerMatchStatsDto buildFixtureMatchStatsDto(Player player,
                                                          PlayerFixtureStatsEntity stats,
                                                          TeamEntity playerTeam,
                                                          LeagueEntity scoringLeague) {
        FixtureEntity fixture = stats.getFixture();
        TeamEntity homeTeam = teamRepo.findById(fixture.getHomeTeamId()).orElse(null);
        TeamEntity awayTeam = teamRepo.findById(fixture.getAwayTeamId()).orElse(null);
        PlayerMatchStatsDto dto = PlayerMatchStatsMapper.toDto(
                player,
                stats,
                homeTeam,
                awayTeam,
                fixture.getHomeTeamScore(),
                fixture.getAwayTeamScore(),
                false,
                leagueScoringService.calculateFixturePlayerScore(stats, scoringLeague)
        );
        dto.setFixtureId(fixture.getId());
        dto.setKickoffTime(fixture.getKickoffTime());
        return dto;
    }

    private PlayerMatchStatsDto buildEmptyFixtureMatchStatsDto(Player player, FixtureEntity fixture) {
        TeamEntity homeTeam = teamRepo.findById(fixture.getHomeTeamId()).orElse(null);
        TeamEntity awayTeam = teamRepo.findById(fixture.getAwayTeamId()).orElse(null);
        PlayerMatchStatsDto dto = PlayerMatchStatsDto.empty(
                player,
                homeTeam,
                awayTeam,
                fixture.getHomeTeamScore(),
                fixture.getAwayTeamScore()
        );
        dto.setGameweekId(fixture.getGameweekId());
        dto.setFixtureId(fixture.getId());
        dto.setKickoffTime(fixture.getKickoffTime());
        return dto;
    }

    private PlayerMatchStatsDto buildEmptyMatchStats(Player player, int gw, TeamEntity playerTeam) {
        var fixtures = fixtureRepo.findAllByGameweekAndTeam(gw, player.getTeamId());

        if (!fixtures.isEmpty()) {
            var f = fixtures.getFirst();
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

            dto.setFixtures(fixtures.stream().map(fixture -> {
                TeamEntity fixtureHome = teamRepo.findById(fixture.getHomeTeamId()).orElse(null);
                TeamEntity fixtureAway = teamRepo.findById(fixture.getAwayTeamId()).orElse(null);
                PlayerMatchStatsDto emptyFixture = PlayerMatchStatsDto.empty(
                        player,
                        fixtureHome,
                        fixtureAway,
                        fixture.getHomeTeamScore(),
                        fixture.getAwayTeamScore()
                );
                emptyFixture.setGameweekId(gw);
                emptyFixture.setFixtureId(fixture.getId());
                emptyFixture.setKickoffTime(fixture.getKickoffTime());
                if (fixture.getHomeTeamScore() != null) {
                    emptyFixture.setStats(List.of(
                            new PlayerMatchStatsDto.StatLine("Minutes played", "0", 0),
                            new PlayerMatchStatsDto.StatLine("Total", "0", 0)
                    ));
                }
                return emptyFixture;
            }).toList());

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
