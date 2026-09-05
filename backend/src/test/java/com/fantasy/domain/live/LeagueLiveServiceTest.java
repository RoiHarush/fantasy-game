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
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.score.PlayerScoreBreakdown;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class LeagueLiveServiceTest {

    @Test
    void returnsOwnedPlayersForActiveFixturesWithSquadContribution() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        GameWeekRepository gameweeks = mock(GameWeekRepository.class);
        FixtureRepository fixtures = mock(FixtureRepository.class);
        UserSquadRepository squads = mock(UserSquadRepository.class);
        PlayerRepository players = mock(PlayerRepository.class);
        PlayerFixtureStatsRepository fixtureStats = mock(PlayerFixtureStatsRepository.class);
        LeagueScoringService scoring = mock(LeagueScoringService.class);

        LeagueEntity league = new LeagueEntity();
        league.setId(4L);
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(3);
        gameweek.setName("Gameweek 3");
        gameweek.setStatus("LIVE");

        FixtureEntity fixture = new FixtureEntity(
                100, 3, 1, 2, LocalDateTime.of(2026, 9, 5, 17, 0), 1, 0
        );
        fixture.setStarted(true);
        fixture.setMinutes(62);

        UserEntity manager = new UserEntity();
        manager.setId(8);
        manager.setName("Roi Harush");
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(18);
        gameData.setUser(manager);
        gameData.setFantasyTeamName("Purple Lions");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setUser(gameData);
        squad.setGameweek(3);
        squad.setStartingLineup(List.of(10));
        squad.setBenchMap(new LinkedHashMap<>());
        squad.setCaptainId(10);

        PlayerEntity player = new PlayerEntity();
        player.setId(10);
        player.setViewName("Salah");
        player.setPosition(PlayerPosition.MIDFIELDER);
        player.setTeamId(1);
        player.setPhoto("10");
        PlayerFixtureStatsEntity stats = new PlayerFixtureStatsEntity();
        stats.setPlayer(player);
        stats.setFixture(fixture);
        stats.setGameweek(3);
        stats.setStarted(true);
        stats.setMinutesPlayed(62);
        stats.setGoals(1);

        when(leagues.findById(4L)).thenReturn(Optional.of(league));
        when(gameweeks.findFirstByStatusOrderByIdAsc("LIVE")).thenReturn(Optional.of(gameweek));
        when(fixtures.findByGameweekId(3)).thenReturn(List.of(fixture));
        when(squads.findByLeagueIdAndGameweek(4L, 3)).thenReturn(List.of(squad));
        when(players.findAllById(any())).thenReturn(List.of(player));
        when(fixtureStats.findByFixture_IdIn(List.of(100))).thenReturn(List.of(stats));
        when(scoring.calculateFixturePlayerScore(stats, league))
                .thenReturn(new PlayerScoreBreakdown(6, List.of()));

        LeagueLiveDto result = service(leagues, gameweeks, fixtures, squads, players, fixtureStats, scoring)
                .getForLeague(4L);

        assertEquals(1, result.fixtures().size());
        assertEquals(1, result.ownedPlayerCount());
        LeagueLiveDto.LivePlayer livePlayer = result.fixtures().getFirst().players().getFirst();
        assertEquals("Salah", livePlayer.viewName());
        assertEquals("Purple Lions", livePlayer.ownerTeamName());
        assertEquals("STARTED", livePlayer.participation());
        assertEquals(2, livePlayer.multiplier());
        assertEquals(6, livePlayer.points());
        assertEquals(12, livePlayer.contributionPoints());
    }

    @Test
    void returnsAnEmptyBoardWithoutLoadingSquadsWhenNoGameweekIsLive() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        GameWeekRepository gameweeks = mock(GameWeekRepository.class);
        FixtureRepository fixtures = mock(FixtureRepository.class);
        UserSquadRepository squads = mock(UserSquadRepository.class);
        PlayerRepository players = mock(PlayerRepository.class);
        PlayerFixtureStatsRepository fixtureStats = mock(PlayerFixtureStatsRepository.class);
        LeagueScoringService scoring = mock(LeagueScoringService.class);
        LeagueEntity league = new LeagueEntity();
        league.setId(4L);

        when(leagues.findById(4L)).thenReturn(Optional.of(league));
        when(gameweeks.findFirstByStatusOrderByIdAsc("LIVE")).thenReturn(Optional.empty());

        LeagueLiveDto result = service(leagues, gameweeks, fixtures, squads, players, fixtureStats, scoring)
                .getForLeague(4L);

        assertTrue(result.fixtures().isEmpty());
        assertEquals(0, result.ownedPlayerCount());
        verifyNoInteractions(fixtures, squads, players, fixtureStats, scoring);
    }

    private LeagueLiveService service(LeagueRepository leagues,
                                      GameWeekRepository gameweeks,
                                      FixtureRepository fixtures,
                                      UserSquadRepository squads,
                                      PlayerRepository players,
                                      PlayerFixtureStatsRepository fixtureStats,
                                      LeagueScoringService scoring) {
        return new LeagueLiveService(leagues, gameweeks, fixtures, squads, players, fixtureStats, scoring);
    }
}
