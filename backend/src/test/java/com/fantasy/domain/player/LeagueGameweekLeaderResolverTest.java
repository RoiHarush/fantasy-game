package com.fantasy.domain.player;

import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserSquadEntity;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LeagueGameweekLeaderResolverTest {

    @Test
    void choosesOneWinnerAcrossEveryLeagueSquad() {
        UserSquadEntity first = squad(1, List.of(10, 11), null, false);
        UserSquadEntity second = squad(2, List.of(20, 21), 20, false);

        assertEquals(Set.of(20), LeagueGameweekLeaderResolver.resolve(
                List.of(first, second),
                Map.of(10, 12, 11, 4, 20, 7, 21, 13)
        ));
    }

    @Test
    void appliesTripleCaptainContributionAcrossTheLeague() {
        UserSquadEntity first = squad(1, List.of(10), null, false);
        UserSquadEntity second = squad(2, List.of(20), 20, true);

        assertEquals(Set.of(20), LeagueGameweekLeaderResolver.resolve(
                List.of(first, second),
                Map.of(10, 14, 20, 5)
        ));
    }

    @Test
    void crownsEveryPlayerSharingTheLeagueHighScore() {
        UserSquadEntity first = squad(1, List.of(10), null, false);
        UserSquadEntity second = squad(2, List.of(20), null, false);

        assertEquals(Set.of(10, 20), LeagueGameweekLeaderResolver.resolve(
                List.of(first, second),
                Map.of(10, 9, 20, 9)
        ));
    }

    @Test
    void doesNotAwardACrownBeforeAnyoneScores() {
        assertEquals(Set.of(), LeagueGameweekLeaderResolver.resolve(
                List.of(squad(1, List.of(10), null, false)),
                Map.of(10, 0)
        ));
    }

    private UserSquadEntity squad(int gameDataId,
                                  List<Integer> starters,
                                  Integer captainId,
                                  boolean tripleCaptain) {
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(gameDataId);

        UserSquadEntity squad = new UserSquadEntity();
        squad.setUser(gameData);
        squad.setStartingLineup(starters);
        squad.setBenchMap(new LinkedHashMap<>());
        squad.setCaptainId(captainId);
        squad.setTripleCaptainActive(tripleCaptain);
        return squad;
    }
}
