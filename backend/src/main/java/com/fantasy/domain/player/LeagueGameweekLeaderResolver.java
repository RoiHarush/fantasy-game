package com.fantasy.domain.player;

import com.fantasy.domain.team.UserSquadEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.LinkedHashSet;
import java.util.Set;

final class LeagueGameweekLeaderResolver {

    private static final List<String> BENCH_SLOTS = List.of("GK", "S1", "S2", "S3");

    private LeagueGameweekLeaderResolver() {}

    static Set<Integer> resolve(List<UserSquadEntity> orderedSquads,
                                Map<Integer, Integer> pointsByPlayer) {
        Set<Integer> leaderIds = new LinkedHashSet<>();
        int leaderPoints = 0;

        for (UserSquadEntity squad : orderedSquads) {
            for (Integer playerId : orderedPlayerIds(squad)) {
                int rawPoints = pointsByPlayer.getOrDefault(playerId, 0);
                int multiplier = Objects.equals(squad.getCaptainId(), playerId)
                        ? (squad.isTripleCaptainActive() ? 3 : 2)
                        : 1;
                int contributionPoints = rawPoints * multiplier;

                if (contributionPoints > leaderPoints) {
                    leaderIds.clear();
                    leaderIds.add(playerId);
                    leaderPoints = contributionPoints;
                } else if (contributionPoints > 0 && contributionPoints == leaderPoints) {
                    leaderIds.add(playerId);
                }
            }
        }

        return Set.copyOf(leaderIds);
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
}
