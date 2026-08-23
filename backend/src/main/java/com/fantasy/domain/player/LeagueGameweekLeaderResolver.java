package com.fantasy.domain.player;

import com.fantasy.domain.team.UserSquadEntity;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

final class LeagueGameweekLeaderResolver {

    private static final List<String> BENCH_SLOTS = List.of("GK", "S1", "S2", "S3");

    private LeagueGameweekLeaderResolver() {}

    static Set<Integer> resolve(List<UserSquadEntity> orderedSquads,
                                Map<Integer, Integer> pointsByPlayer) {
        return resolve(orderedSquads, pointsByPlayer, Map.of())
                .map(leader -> Set.of(leader.playerId()))
                .orElseGet(Set::of);
    }

    static Optional<Leader> resolve(List<UserSquadEntity> orderedSquads,
                                    Map<Integer, Integer> pointsByPlayer,
                                    Map<Integer, PerformanceTieBreak> tieBreakByPlayer) {
        Candidate leader = null;

        for (UserSquadEntity squad : orderedSquads) {
            for (Integer playerId : orderedPlayerIds(squad)) {
                int rawPoints = pointsByPlayer.getOrDefault(playerId, 0);
                int multiplier = Objects.equals(squad.getCaptainId(), playerId)
                        ? (squad.isTripleCaptainActive() ? 3 : 2)
                        : 1;
                int contributionPoints = rawPoints * multiplier;
                if (contributionPoints <= 0) continue;

                Candidate candidate = new Candidate(
                        playerId,
                        contributionPoints,
                        tieBreakByPlayer.getOrDefault(
                                playerId,
                                PerformanceTieBreak.fromRawPoints(rawPoints)
                        )
                );
                if (leader == null || Candidate.BEST_FIRST.compare(candidate, leader) < 0) {
                    leader = candidate;
                }
            }
        }

        return Optional.ofNullable(leader)
                .map(candidate -> new Leader(candidate.playerId(), candidate.contributionPoints()));
    }

    static List<Integer> orderedPlayerIds(UserSquadEntity squad) {
        List<Integer> playerIds = new ArrayList<>();
        if (squad.getStartingLineup() != null) {
            squad.getStartingLineup().stream().filter(Objects::nonNull).forEach(playerIds::add);
        }
        if (squad.getBenchMap() != null) {
            BENCH_SLOTS.stream()
                    .map(squad.getBenchMap()::get)
                    .filter(Objects::nonNull)
                    .forEach(playerIds::add);
        }
        return playerIds;
    }

    record Leader(int playerId, int contributionPoints) {}

    record PerformanceTieBreak(int rawPoints,
                               int positiveImpactPoints,
                               int goalImpactPoints,
                               int penaltySaveImpactPoints,
                               int cleanSheetImpactPoints,
                               int assistImpactPoints,
                               int minutesPlayed,
                               int negativeImpactPoints) {
        static PerformanceTieBreak fromRawPoints(int rawPoints) {
            return new PerformanceTieBreak(rawPoints, 0, 0, 0, 0, 0, 0, 0);
        }
    }

    private record Candidate(int playerId,
                             int contributionPoints,
                             PerformanceTieBreak performance) {
        private static final Comparator<Candidate> BEST_FIRST = Comparator
                .comparingInt(Candidate::contributionPoints).reversed()
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().rawPoints()
                ).reversed())
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().positiveImpactPoints()
                ).reversed())
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().goalImpactPoints()
                ).reversed())
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().penaltySaveImpactPoints()
                ).reversed())
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().cleanSheetImpactPoints()
                ).reversed())
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().assistImpactPoints()
                ).reversed())
                .thenComparing(Comparator.comparingInt(
                        (Candidate candidate) -> candidate.performance().minutesPlayed()
                ).reversed())
                .thenComparingInt(candidate -> candidate.performance().negativeImpactPoints())
                .thenComparingInt(Candidate::playerId);
    }
}
