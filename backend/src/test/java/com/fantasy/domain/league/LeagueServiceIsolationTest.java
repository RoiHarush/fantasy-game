package com.fantasy.domain.league;

import com.fantasy.domain.game.GameWeekDto;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserPointsEntity;
import com.fantasy.domain.team.UserPointsRepository;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeagueServiceIsolationTest {

    @Test
    void buildsTheTableOnlyFromTheRequestingUsersLeague() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        UserGameDataRepository gameData = mock(UserGameDataRepository.class);
        UserPointsRepository points = mock(UserPointsRepository.class);
        GameWeekService gameweeks = mock(GameWeekService.class);
        UserEntity user = new UserEntity();
        user.setId(7);
        user.setName("League Member");
        LeagueEntity league = new LeagueEntity();
        league.setId(10L);
        league.setName("Private League");
        league.setUsers(new ArrayList<>(List.of(user)));

        UserGameDataEntity data = new UserGameDataEntity();
        data.setId(70);
        data.setUser(user);
        data.setFantasyTeamName("Member FC");
        data.setTotalPoints(123);
        UserPointsEntity gameweekPoints = new UserPointsEntity();
        gameweekPoints.setUser(data);
        gameweekPoints.setGameweek(1);
        gameweekPoints.setPoints(17);

        when(leagues.findFirstByUsers_Id(7)).thenReturn(Optional.of(league));
        when(gameData.findByLeague_Id(10L)).thenReturn(List.of(data));
        when(gameweeks.getCurrentGameweek()).thenReturn(
                new GameWeekDto(1, "GW1", null, null, "LIVE", null, false, false)
        );
        when(points.findByGameweekAndUser_League_Id(1, 10L)).thenReturn(List.of(gameweekPoints));

        LeagueDto result = new LeagueService(leagues, gameData, points, gameweeks)
                .getLiveLeagueDto(7);

        assertEquals("Private League", result.getName());
        assertEquals(1, result.getUsers().size());
        assertEquals(7, result.getUsers().getFirst().getId());
        assertEquals(123, result.getUsers().getFirst().getPoints());
        assertEquals(17, result.getUsers().getFirst().getGwPoints());
    }
}
