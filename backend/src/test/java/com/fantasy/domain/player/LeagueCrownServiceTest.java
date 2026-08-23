package com.fantasy.domain.player;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LeagueCrownServiceTest {

    @Test
    void backfillsOfficialCrownAndIncludesItInManagerHistory() {
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserSquadRepository squadRepository = mock(UserSquadRepository.class);
        PlayerRepository playerRepository = mock(PlayerRepository.class);
        PlayerPointsRepository pointsRepository = mock(PlayerPointsRepository.class);
        PlayerGameweekStatsRepository statsRepository = mock(PlayerGameweekStatsRepository.class);
        PlayerFixtureStatsRepository fixtureStatsRepository = mock(PlayerFixtureStatsRepository.class);
        GameWeekRepository gameWeekRepository = mock(GameWeekRepository.class);

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        UserGameDataEntity firstManager = manager(101, 11, "Roi", "Purple Lions", league);
        UserGameDataEntity secondManager = manager(102, 12, "Alex", "Blue XI", league);
        UserSquadEntity firstSquad = squad(1001L, firstManager, 1, 10);
        UserSquadEntity secondSquad = squad(1002L, secondManager, 1, 20);

        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(1);
        gameweek.setCalculated(true);
        PlayerEntity winner = player(20, "Winner");

        when(gameDataRepository.findByUserId(11)).thenReturn(Optional.of(firstManager));
        when(gameDataRepository.findByLeague_Id(7L)).thenReturn(List.of(firstManager, secondManager));
        when(squadRepository.findByGameweek(1)).thenReturn(List.of(firstSquad, secondSquad));
        when(squadRepository.findById(1002L)).thenReturn(Optional.of(secondSquad));
        when(gameWeekRepository.findById(1)).thenReturn(Optional.of(gameweek));
        when(statsRepository.findByGameweek(1)).thenReturn(List.of());
        when(fixtureStatsRepository.findByGameweek(1)).thenReturn(List.of());
        when(pointsRepository.findByPlayer_IdAndGameweek(anyInt(), anyInt()))
                .thenAnswer(invocation -> Optional.of(points(
                        invocation.getArgument(0),
                        invocation.<Integer>getArgument(0) == 20 ? 14 : 8
                )));
        when(playerRepository.findById(20)).thenReturn(Optional.of(winner));

        LeagueCrownService service = new LeagueCrownService(
                gameDataRepository,
                squadRepository,
                playerRepository,
                pointsRepository,
                statsRepository,
                fixtureStatsRepository,
                gameWeekRepository,
                mock(LeagueScoringService.class)
        );

        CrownSummaryDto summary = service.getSummaryForUser(11, 1);

        assertNull(firstSquad.getCrownPlayerId());
        assertEquals(20, secondSquad.getCrownPlayerId());
        assertEquals(14, secondSquad.getCrownPoints());
        assertNotNull(secondSquad.getCrownAwardedAt());
        verify(squadRepository).saveAll(List.of(firstSquad, secondSquad));

        assertEquals(1, summary.playersOfTheWeek().size());
        PlayerOfTheWeekDto award = summary.playersOfTheWeek().getFirst();
        assertTrue(award.official());
        assertEquals(12, award.managerId());
        assertEquals("Winner", award.playerName());

        assertEquals(2, summary.crownStandings().size());
        CrownStandingDto leader = summary.crownStandings().getFirst();
        assertEquals(12, leader.managerId());
        assertEquals(1, leader.crownCount());
        assertEquals(20, leader.crowns().getFirst().id());
    }

    private UserGameDataEntity manager(int gameDataId,
                                       int userId,
                                       String name,
                                       String teamName,
                                       LeagueEntity league) {
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setName(name);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(gameDataId);
        gameData.setUser(user);
        gameData.setFantasyTeamName(teamName);
        gameData.setLeague(league);
        return gameData;
    }

    private UserSquadEntity squad(long id,
                                  UserGameDataEntity manager,
                                  int gameweek,
                                  int playerId) {
        UserSquadEntity squad = new UserSquadEntity();
        squad.setId(id);
        squad.setUser(manager);
        squad.setGameweek(gameweek);
        squad.setStartingLineup(List.of(playerId));
        squad.setBenchMap(new LinkedHashMap<>());
        return squad;
    }

    private PlayerEntity player(int id, String name) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setViewName(name);
        player.setTeamId(1);
        player.setPhoto("winner.png");
        player.setPosition(PlayerPosition.FORWARD);
        return player;
    }

    private PlayerPointsEntity points(int playerId, int points) {
        PlayerEntity player = new PlayerEntity();
        player.setId(playerId);
        PlayerPointsEntity result = new PlayerPointsEntity();
        result.setPlayer(player);
        result.setGameweek(1);
        result.setPoints(points);
        return result;
    }
}
