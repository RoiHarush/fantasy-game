package com.fantasy.domain.live;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerFixtureStatsEntity;
import com.fantasy.domain.player.PlayerFixtureStatsRepository;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LeagueLiveService {

    private final LeagueRepository leagueRepository;
    private final GameWeekRepository gameWeekRepository;
    private final FixtureRepository fixtureRepository;
    private final UserSquadRepository squadRepository;
    private final PlayerRepository playerRepository;
    private final PlayerFixtureStatsRepository fixtureStatsRepository;
    private final LeagueScoringService scoringService;

    public LeagueLiveService(LeagueRepository leagueRepository,
                             GameWeekRepository gameWeekRepository,
                             FixtureRepository fixtureRepository,
                             UserSquadRepository squadRepository,
                             PlayerRepository playerRepository,
                             PlayerFixtureStatsRepository fixtureStatsRepository,
                             LeagueScoringService scoringService) {
        this.leagueRepository = leagueRepository;
        this.gameWeekRepository = gameWeekRepository;
        this.fixtureRepository = fixtureRepository;
        this.squadRepository = squadRepository;
        this.playerRepository = playerRepository;
        this.fixtureStatsRepository = fixtureStatsRepository;
        this.scoringService = scoringService;
    }

    public LeagueLiveDto getForUser(int userId) {
        LeagueEntity league = leagueRepository.findFirstByUsers_Id(userId)
                .orElseThrow(() -> new IllegalStateException("User is not in a league"));
        return getForLeague(league.getId());
    }

    public LeagueLiveDto getForLeague(long leagueId) {
        LeagueEntity league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        GameWeekEntity gameweek = gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE").orElse(null);
        LocalDateTime refreshedAt = LocalDateTime.now();

        if (gameweek == null) {
            return new LeagueLiveDto(null, null, List.of(), null, 0, refreshedAt);
        }

        List<FixtureEntity> gameweekFixtures = fixtureRepository.findByGameweekId(gameweek.getId()).stream()
                .sorted(Comparator.comparing(FixtureEntity::getKickoffTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        List<FixtureEntity> activeFixtures = gameweekFixtures.stream()
                .filter(FixtureEntity::isStarted)
                .filter(fixture -> !fixture.isFinished())
                .toList();
        LeagueLiveDto.UpcomingFixture nextFixture = gameweekFixtures.stream()
                .filter(fixture -> !fixture.isStarted() && !fixture.isFinished())
                .findFirst()
                .map(this::toUpcomingFixture)
                .orElse(null);

        if (activeFixtures.isEmpty()) {
            return new LeagueLiveDto(
                    gameweek.getId(), gameweek.getName(), List.of(), nextFixture, 0, refreshedAt
            );
        }

        List<UserSquadEntity> squads = squadRepository.findByLeagueIdAndGameweek(leagueId, gameweek.getId());
        Map<Integer, Ownership> ownershipByPlayer = buildOwnership(squads);
        Set<Integer> activeTeamIds = activeFixtures.stream()
                .flatMap(fixture -> List.of(fixture.getHomeTeamId(), fixture.getAwayTeamId()).stream())
                .collect(Collectors.toSet());
        Set<Integer> relevantPlayerIds = ownershipByPlayer.keySet();
        Map<Integer, PlayerEntity> playersById = playerRepository.findAllById(relevantPlayerIds).stream()
                .filter(player -> activeTeamIds.contains(player.getTeamId()))
                .collect(Collectors.toMap(PlayerEntity::getId, Function.identity()));
        List<Integer> activeFixtureIds = activeFixtures.stream().map(FixtureEntity::getId).toList();
        Map<FixturePlayerKey, PlayerFixtureStatsEntity> statsByFixtureAndPlayer = fixtureStatsRepository
                .findByFixture_IdIn(activeFixtureIds).stream()
                .collect(Collectors.toMap(
                        stats -> new FixturePlayerKey(stats.getFixture().getId(), stats.getPlayer().getId()),
                        Function.identity(),
                        (first, ignored) -> first
                ));

        List<LeagueLiveDto.LiveFixture> fixtureDtos = activeFixtures.stream()
                .map(fixture -> toLiveFixture(
                        fixture,
                        league,
                        ownershipByPlayer,
                        playersById,
                        statsByFixtureAndPlayer
                ))
                .toList();
        int ownedPlayerCount = fixtureDtos.stream().mapToInt(fixture -> fixture.players().size()).sum();

        return new LeagueLiveDto(
                gameweek.getId(),
                gameweek.getName(),
                fixtureDtos,
                nextFixture,
                ownedPlayerCount,
                refreshedAt
        );
    }

    private LeagueLiveDto.LiveFixture toLiveFixture(
            FixtureEntity fixture,
            LeagueEntity league,
            Map<Integer, Ownership> ownershipByPlayer,
            Map<Integer, PlayerEntity> playersById,
            Map<FixturePlayerKey, PlayerFixtureStatsEntity> statsByFixtureAndPlayer
    ) {
        List<LeagueLiveDto.LivePlayer> players = playersById.values().stream()
                .filter(player -> player.getTeamId() == fixture.getHomeTeamId()
                        || player.getTeamId() == fixture.getAwayTeamId())
                .map(player -> toLivePlayer(
                        player,
                        ownershipByPlayer.get(player.getId()),
                        statsByFixtureAndPlayer.get(new FixturePlayerKey(fixture.getId(), player.getId())),
                        league
                ))
                .sorted(Comparator
                        .comparingInt((LeagueLiveDto.LivePlayer player) -> participationOrder(player.participation()))
                        .thenComparing(LeagueLiveDto.LivePlayer::points, Comparator.reverseOrder())
                        .thenComparing(LeagueLiveDto.LivePlayer::viewName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new LeagueLiveDto.LiveFixture(
                fixture.getId(),
                fixture.getHomeTeamId(),
                fixture.getAwayTeamId(),
                fixture.getHomeTeamScore(),
                fixture.getAwayTeamScore(),
                fixture.getMinutes(),
                fixture.getKickoffTime(),
                players
        );
    }

    private LeagueLiveDto.LivePlayer toLivePlayer(PlayerEntity player,
                                                   Ownership ownership,
                                                   PlayerFixtureStatsEntity stats,
                                                   LeagueEntity league) {
        int minutes = stats == null ? 0 : stats.getMinutesPlayed();
        int points = stats == null ? 0 : scoringService.calculateFixturePlayerScore(stats, league).totalPoints();
        int multiplier = contributionMultiplier(ownership);
        String participation = stats == null || minutes == 0
                ? "NOT_PLAYED"
                : stats.isStarted() ? "STARTED" : "SUBSTITUTE";

        return new LeagueLiveDto.LivePlayer(
                player.getId(),
                player.getViewName(),
                league.effectivePosition(player).name(),
                player.getTeamId(),
                player.getPhoto(),
                ownership.ownerUserId(),
                ownership.ownerName(),
                ownership.ownerTeamName(),
                ownership.squadRole(),
                ownership.captain(),
                multiplier,
                minutes,
                participation,
                points,
                points * multiplier,
                stats == null ? 0 : stats.getGoals(),
                stats == null ? 0 : stats.getAssists(),
                stats == null ? 0 : stats.getYellowCards(),
                stats == null ? 0 : stats.getRedCards()
        );
    }

    private Map<Integer, Ownership> buildOwnership(List<UserSquadEntity> squads) {
        Map<Integer, Ownership> ownership = new LinkedHashMap<>();
        for (UserSquadEntity squad : squads) {
            UserGameDataEntity gameData = squad.getUser();
            if (gameData == null || gameData.getUser() == null) continue;
            int ownerUserId = gameData.getUser().getId();
            String ownerName = gameData.getUser().getFullName();
            String ownerTeamName = gameData.getFantasyTeamName();

            addOwnership(ownership, squad.getStartingLineup(), playerId -> new Ownership(
                    ownerUserId,
                    ownerName,
                    ownerTeamName,
                    "STARTING",
                    Objects.equals(squad.getCaptainId(), playerId),
                    squad.isTripleCaptainActive(),
                    squad.isBenchBoostActive()
            ));
            addOwnership(ownership, squad.getBenchMap().values(), playerId -> new Ownership(
                    ownerUserId,
                    ownerName,
                    ownerTeamName,
                    "BENCH",
                    false,
                    false,
                    squad.isBenchBoostActive()
            ));
            if (squad.getIrId() != null) {
                ownership.putIfAbsent(squad.getIrId(), new Ownership(
                        ownerUserId, ownerName, ownerTeamName, "IR", false, false, false
                ));
            }
        }
        return ownership;
    }

    private void addOwnership(Map<Integer, Ownership> ownership,
                              Collection<Integer> playerIds,
                              Function<Integer, Ownership> factory) {
        if (playerIds == null) return;
        for (Integer playerId : playerIds) {
            if (playerId != null) ownership.putIfAbsent(playerId, factory.apply(playerId));
        }
    }

    private int contributionMultiplier(Ownership ownership) {
        if ("IR".equals(ownership.squadRole())) return 0;
        if ("BENCH".equals(ownership.squadRole())) return ownership.benchBoost() ? 1 : 0;
        if (!ownership.captain()) return 1;
        return ownership.tripleCaptain() ? 3 : 2;
    }

    private int participationOrder(String participation) {
        return switch (participation) {
            case "STARTED" -> 0;
            case "SUBSTITUTE" -> 1;
            default -> 2;
        };
    }

    private LeagueLiveDto.UpcomingFixture toUpcomingFixture(FixtureEntity fixture) {
        return new LeagueLiveDto.UpcomingFixture(
                fixture.getId(),
                fixture.getGameweekId(),
                fixture.getHomeTeamId(),
                fixture.getAwayTeamId(),
                fixture.getKickoffTime()
        );
    }

    private record FixturePlayerKey(int fixtureId, int playerId) {}

    private record Ownership(
            int ownerUserId,
            String ownerName,
            String ownerTeamName,
            String squadRole,
            boolean captain,
            boolean tripleCaptain,
            boolean benchBoost
    ) {}
}
