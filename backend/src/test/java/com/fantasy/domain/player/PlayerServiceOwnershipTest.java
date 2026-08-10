package com.fantasy.domain.player;

import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.realWorldData.TeamRepository;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRole;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.SupplementalDraftPoolService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlayerServiceOwnershipTest {

    @Test
    void projectsPlayerOwnershipFromTheRequestingUsersLeagueSquads() {
        PlayerRepository playerRepository = mock(PlayerRepository.class);
        PlayerPointsRepository pointsRepository = mock(PlayerPointsRepository.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        LeagueEntity league = new LeagueEntity();
        league.setId(10L);

        UserEntity owner = user(7, "Owner");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(1));
        squad.setBenchMap(new LinkedHashMap<>());
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setUser(owner);
        gameData.setNextSquad(squad);

        when(leagueRepository.findFirstByUsers_Id(42)).thenReturn(Optional.of(league));
        when(gameDataRepository.findAllByLeagueIdWithSquads(10L)).thenReturn(List.of(gameData));
        when(pointsRepository.findAll()).thenReturn(List.of());
        when(playerRepository.findAll()).thenReturn(List.of(player(1), player(2)));

        PlayerService service = new PlayerService(
                playerRepository,
                pointsRepository,
                mock(PlayerGameweekStatsRepository.class),
                mock(PlayerFixtureStatsRepository.class),
                mock(TeamRepository.class),
                mock(FixtureRepository.class),
                mock(UserSquadRepository.class),
                mock(FixtureService.class),
                leagueRepository,
                gameDataRepository,
                mock(LeagueScoringService.class),
                mock(SupplementalDraftPoolService.class),
                mock(LeagueTransferWindowRepository.class)
        );

        List<PlayerDto> players = service.getAllPlayers(42);

        PlayerDto owned = players.stream().filter(player -> player.getId() == 1).findFirst().orElseThrow();
        PlayerDto free = players.stream().filter(player -> player.getId() == 2).findFirst().orElseThrow();
        assertEquals(7, owned.getOwnerId());
        assertEquals("Owner", owned.getOwnerName());
        assertNull(free.getOwnerId());
        assertTrue(free.isAvailable());
    }

    @Test
    void matchDetailsIncludeEveryDoubleGameweekFixtureEvenWhenThePlayerMissesOne() {
        PlayerRepository playerRepository = mock(PlayerRepository.class);
        PlayerPointsRepository pointsRepository = mock(PlayerPointsRepository.class);
        PlayerGameweekStatsRepository statsRepository = mock(PlayerGameweekStatsRepository.class);
        PlayerFixtureStatsRepository fixtureStatsRepository = mock(PlayerFixtureStatsRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        FixtureRepository fixtureRepository = mock(FixtureRepository.class);
        PlayerEntity player = player(1);
        TeamEntity playerTeam = team(1, "ARS");
        TeamEntity firstOpponent = team(2, "CHE");
        TeamEntity secondOpponent = team(3, "MCI");
        FixtureEntity firstFixture = fixture(101, 8, 1, 2, LocalDateTime.of(2026, 1, 10, 15, 0));
        FixtureEntity secondFixture = fixture(102, 8, 3, 1, LocalDateTime.of(2026, 1, 14, 20, 0));

        PlayerGameweekStatsEntity aggregate = new PlayerGameweekStatsEntity();
        aggregate.setPlayer(player);
        aggregate.setGameweek(8);
        aggregate.setOpponentTeamId(2);
        aggregate.setWasHome(true);
        aggregate.setMinutesPlayed(90);
        aggregate.setStarted(true);

        PlayerFixtureStatsEntity firstMatchStats = new PlayerFixtureStatsEntity();
        firstMatchStats.setPlayer(player);
        firstMatchStats.setFixture(firstFixture);
        firstMatchStats.setGameweek(8);
        firstMatchStats.setMinutesPlayed(90);
        firstMatchStats.setStarted(true);

        when(playerRepository.findById(1)).thenReturn(Optional.of(player));
        when(pointsRepository.findByPlayer_Id(1)).thenReturn(List.of());
        when(statsRepository.findByPlayer_IdAndGameweek(1, 8)).thenReturn(Optional.of(aggregate));
        when(fixtureStatsRepository.findByPlayer_IdAndGameweekOrderByFixture_KickoffTime(1, 8))
                .thenReturn(List.of(firstMatchStats));
        when(teamRepository.findById(1)).thenReturn(Optional.of(playerTeam));
        when(teamRepository.findById(2)).thenReturn(Optional.of(firstOpponent));
        when(teamRepository.findById(3)).thenReturn(Optional.of(secondOpponent));
        when(fixtureRepository.findByHomeTeamIdAndAwayTeamIdAndGameweekId(1, 2, 8))
                .thenReturn(Optional.of(firstFixture));
        when(fixtureRepository.findAllByGameweekAndTeam(8, 1))
                .thenReturn(List.of(firstFixture, secondFixture));

        PlayerService service = new PlayerService(
                playerRepository,
                pointsRepository,
                statsRepository,
                fixtureStatsRepository,
                teamRepository,
                fixtureRepository,
                mock(UserSquadRepository.class),
                mock(FixtureService.class),
                mock(LeagueRepository.class),
                mock(UserGameDataRepository.class),
                new LeagueScoringService(),
                mock(SupplementalDraftPoolService.class),
                mock(LeagueTransferWindowRepository.class)
        );

        PlayerMatchStatsDto result = service.getMatchStats(1, 8, null);

        assertEquals(2, result.getFixtures().size());
        assertEquals(101, result.getFixtures().get(0).getFixtureId());
        assertEquals(102, result.getFixtures().get(1).getFixtureId());
        assertTrue(result.getFixtures().get(1).getStats().isEmpty());
    }

    private static PlayerEntity player(int id) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setFirstName("Test");
        player.setLastName("Player");
        player.setViewName("Player " + id);
        player.setPosition(PlayerPosition.MIDFIELDER);
        player.setTeamId(1);
        return player;
    }

    private static UserEntity user(int id, String name) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName(name);
        user.setUsername("user" + id);
        user.setPassword("encoded");
        user.setRegisteredAt(LocalDateTime.now());
        user.setRole(UserRole.ROLE_USER);
        return user;
    }

    private static TeamEntity team(int id, String shortName) {
        TeamEntity team = new TeamEntity();
        team.setId(id);
        team.setName(shortName);
        team.setShortName(shortName);
        return team;
    }

    private static FixtureEntity fixture(int id,
                                         int gameweek,
                                         int homeTeamId,
                                         int awayTeamId,
                                         LocalDateTime kickoffTime) {
        return new FixtureEntity(id, gameweek, homeTeamId, awayTeamId, kickoffTime, null, null);
    }
}
