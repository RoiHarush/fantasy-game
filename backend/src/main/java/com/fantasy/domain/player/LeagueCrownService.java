package com.fantasy.domain.player;

import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.score.PlayerScoreBreakdown;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LeagueCrownService {

    private final UserGameDataRepository gameDataRepository;
    private final UserSquadRepository squadRepository;
    private final PlayerRepository playerRepository;
    private final PlayerPointsRepository pointsRepository;
    private final PlayerGameweekStatsRepository statsRepository;
    private final PlayerFixtureStatsRepository fixtureStatsRepository;
    private final GameWeekRepository gameWeekRepository;
    private final LeagueScoringService leagueScoringService;

    public LeagueCrownService(UserGameDataRepository gameDataRepository,
                              UserSquadRepository squadRepository,
                              PlayerRepository playerRepository,
                              PlayerPointsRepository pointsRepository,
                              PlayerGameweekStatsRepository statsRepository,
                              PlayerFixtureStatsRepository fixtureStatsRepository,
                              GameWeekRepository gameWeekRepository,
                              LeagueScoringService leagueScoringService) {
        this.gameDataRepository = gameDataRepository;
        this.squadRepository = squadRepository;
        this.playerRepository = playerRepository;
        this.pointsRepository = pointsRepository;
        this.statsRepository = statsRepository;
        this.fixtureStatsRepository = fixtureStatsRepository;
        this.gameWeekRepository = gameWeekRepository;
        this.leagueScoringService = leagueScoringService;
    }

    @Transactional
    public CrownSummaryDto getSummaryForUser(int userId, int throughGameweek) {
        LeagueEntity league = gameDataRepository.findByUserId(userId)
                .map(UserGameDataEntity::getLeague)
                .orElseThrow(() -> new IllegalArgumentException("No league found for user " + userId));
        return getSummary(league, throughGameweek);
    }

    @Transactional
    public CrownSummaryDto getSummary(LeagueEntity league, int throughGameweek) {
        if (league == null || league.getId() == null) {
            return new CrownSummaryDto(List.of(), List.of());
        }

        List<PlayerOfTheWeekDto> awards = new ArrayList<>();
        for (int gameweek = 1; gameweek <= Math.min(38, throughGameweek); gameweek++) {
            int resolvedGameweek = gameweek;
            boolean official = gameWeekRepository.findById(resolvedGameweek)
                    .map(gameWeek -> gameWeek.isCalculated())
                    .orElse(false);
            if (official) {
                reconcileLeagueGameweek(league, resolvedGameweek);
            }
            resolveLeagueGameweek(league, resolvedGameweek)
                    .flatMap(leader -> toDto(leader, resolvedGameweek, official))
                    .ifPresent(awards::add);
        }

        return new CrownSummaryDto(List.copyOf(awards), standings(league, awards));
    }

    @Transactional
    public void reconcileFinalizedGameweek(int gameweek) {
        leagueSquads(gameweek).stream()
                .map(UserSquadEntity::getUser)
                .filter(Objects::nonNull)
                .map(UserGameDataEntity::getLeague)
                .filter(Objects::nonNull)
                .filter(league -> league.getId() != null)
                .collect(Collectors.toMap(LeagueEntity::getId, Function.identity(), (first, ignored) -> first))
                .values()
                .forEach(league -> reconcileLeagueGameweek(league, gameweek));
    }

    Optional<LeagueGameweekLeaderResolver.Leader> resolveLeagueGameweek(LeagueEntity league,
                                                                        int gameweek) {
        List<UserSquadEntity> squads = leagueSquads(league, gameweek);
        if (squads.isEmpty()) return Optional.empty();

        Optional<UserSquadEntity> persistedWinner = squads.stream()
                .filter(squad -> squad.getCrownPlayerId() != null && squad.getCrownPoints() != null)
                .findFirst();
        if (persistedWinner.isPresent()) {
            UserSquadEntity winner = persistedWinner.get();
            return Optional.of(new LeagueGameweekLeaderResolver.Leader(
                    winner.getId(),
                    winner.getUser() == null ? null : winner.getUser().getId(),
                    winner.getCrownPlayerId(),
                    winner.getCrownPoints()
            ));
        }

        return calculateLeader(league, gameweek, squads);
    }

    private void reconcileLeagueGameweek(LeagueEntity league, int gameweek) {
        List<UserSquadEntity> squads = leagueSquads(league, gameweek);
        if (squads.isEmpty()) return;

        LeagueGameweekLeaderResolver.Leader leader = calculateLeader(league, gameweek, squads).orElse(null);
        boolean changed = false;
        for (UserSquadEntity squad : squads) {
            boolean winner = leader != null && Objects.equals(squad.getId(), leader.squadId());
            if (winner) {
                if (!Objects.equals(squad.getCrownPlayerId(), leader.playerId())
                        || !Objects.equals(squad.getCrownPoints(), leader.contributionPoints())) {
                    squad.setCrownPlayerId(leader.playerId());
                    squad.setCrownPoints(leader.contributionPoints());
                    squad.setCrownAwardedAt(LocalDateTime.now());
                    changed = true;
                }
            } else if (squad.getCrownPlayerId() != null
                    || squad.getCrownPoints() != null
                    || squad.getCrownAwardedAt() != null) {
                squad.clearCrown();
                changed = true;
            }
        }
        if (changed) squadRepository.saveAll(squads);
    }

    private Optional<LeagueGameweekLeaderResolver.Leader> calculateLeader(
            LeagueEntity league,
            int gameweek,
            List<UserSquadEntity> squads) {
        Map<Integer, PlayerGameweekStatsEntity> statsByPlayer = Optional
                .ofNullable(statsRepository.findByGameweek(gameweek))
                .orElseGet(List::of)
                .stream()
                .collect(Collectors.toMap(
                        stats -> stats.getPlayer().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));
        Map<Integer, List<PlayerFixtureStatsEntity>> fixtureStatsByPlayer = Optional
                .ofNullable(fixtureStatsRepository.findByGameweek(gameweek))
                .orElseGet(List::of)
                .stream()
                .collect(Collectors.groupingBy(stats -> stats.getPlayer().getId()));

        Set<Integer> candidatePlayerIds = squads.stream()
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
                    ? pointsRepository.findByPlayer_IdAndGameweek(playerId, gameweek)
                            .map(PlayerPointsEntity::getPoints)
                            .orElse(0)
                    : score.totalPoints();
            pointsByPlayer.put(playerId, points);
            if (stats != null && score != null) {
                int positiveImpactPoints = score.lines().stream()
                        .filter(line -> !"Minutes played".equals(line.label()))
                        .mapToInt(line -> Math.max(0, line.points()))
                        .sum();
                int negativeImpactPoints = score.lines().stream()
                        .mapToInt(line -> Math.max(0, -line.points()))
                        .sum();
                tieBreakByPlayer.put(playerId, new LeagueGameweekLeaderResolver.PerformanceTieBreak(
                        points,
                        positiveImpactPoints,
                        pointsForLabels(score, "Goals", "Forward bonus"),
                        pointsForLabels(score, "Penalties saved"),
                        pointsForLabels(score, "Clean sheets"),
                        pointsForLabels(score, "Assists"),
                        stats.getMinutesPlayed(),
                        negativeImpactPoints
                ));
            }
        }

        return LeagueGameweekLeaderResolver.resolve(squads, pointsByPlayer, tieBreakByPlayer);
    }

    private Optional<PlayerOfTheWeekDto> toDto(LeagueGameweekLeaderResolver.Leader leader,
                                                int gameweek,
                                                boolean official) {
        PlayerEntity player = playerRepository.findById(leader.playerId()).orElse(null);
        UserSquadEntity squad = leader.squadId() == null
                ? null
                : squadRepository.findById(leader.squadId()).orElse(null);
        if (player == null || squad == null || squad.getUser() == null || squad.getUser().getUser() == null) {
            return Optional.empty();
        }
        var manager = squad.getUser().getUser();
        return Optional.of(new PlayerOfTheWeekDto(
                player.getId(),
                gameweek,
                player.getViewName(),
                player.getTeamId(),
                leader.contributionPoints(),
                player.getPhoto(),
                player.getPosition().getCode(),
                manager.getId(),
                manager.getFullName(),
                squad.getUser().getFantasyTeamName(),
                official
        ));
    }

    private List<CrownStandingDto> standings(LeagueEntity league,
                                              List<PlayerOfTheWeekDto> awards) {
        Map<Integer, List<PlayerOfTheWeekDto>> awardsByManager = awards.stream()
                .filter(PlayerOfTheWeekDto::official)
                .collect(Collectors.groupingBy(
                        PlayerOfTheWeekDto::managerId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return gameDataRepository.findByLeague_Id(league.getId()).stream()
                .filter(gameData -> gameData.getUser() != null)
                .map(gameData -> {
                    int managerId = gameData.getUser().getId();
                    List<PlayerOfTheWeekDto> managerAwards = awardsByManager.getOrDefault(managerId, List.of());
                    String logoPath = gameData.getTeamLogoBytes() != null && gameData.getTeamLogoBytes().length > 0
                            ? "/api/users/" + managerId + "/team-logo?v=" + gameData.getTeamLogoVersion()
                            : "/UI/team-placeholder.svg";
                    return new CrownStandingDto(
                            managerId,
                            gameData.getUser().getFullName(),
                            gameData.getFantasyTeamName(),
                            logoPath,
                            managerAwards.size(),
                            List.copyOf(managerAwards)
                    );
                })
                .sorted(Comparator.comparingInt(CrownStandingDto::crownCount).reversed()
                        .thenComparing(CrownStandingDto::managerName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private List<UserSquadEntity> leagueSquads(LeagueEntity league, int gameweek) {
        if (league == null || league.getId() == null) return List.of();
        return leagueSquads(gameweek).stream()
                .filter(squad -> squad.getUser() != null
                        && squad.getUser().getLeague() != null
                        && Objects.equals(squad.getUser().getLeague().getId(), league.getId()))
                .sorted(Comparator.comparing(
                        squad -> squad.getUser().getId(),
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();
    }

    private List<UserSquadEntity> leagueSquads(int gameweek) {
        return Optional.ofNullable(squadRepository.findByGameweek(gameweek)).orElseGet(List::of);
    }

    private int pointsForLabels(PlayerScoreBreakdown score, String... labels) {
        Set<String> includedLabels = Set.of(labels);
        return score.lines().stream()
                .filter(line -> includedLabels.contains(line.label()))
                .mapToInt(line -> Math.max(0, line.points()))
                .sum();
    }
}
