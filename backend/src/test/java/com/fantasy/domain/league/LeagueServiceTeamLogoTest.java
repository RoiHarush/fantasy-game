package com.fantasy.domain.league;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserPointsRepository;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeagueServiceTeamLogoTest {

    @Test
    void exposesTheVersionedTeamLogoInLeagueStandings() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserPointsRepository userPointsRepository = mock(UserPointsRepository.class);
        GameWeekService gameWeekService = mock(GameWeekService.class);

        UserEntity user = new UserEntity();
        user.setId(7);
        user.setName("Test Manager");

        LeagueEntity league = new LeagueEntity("Test League", "TEST123", user, List.of(user));
        league.setId(12L);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setUser(user);
        gameData.setFantasyTeamName("Crop United");
        gameData.setTeamLogoBytes(new byte[] { 1, 2, 3 });
        gameData.setTeamLogoVersion(42L);

        when(leagueRepository.findFirstByUsers_Id(7)).thenReturn(Optional.of(league));
        when(gameDataRepository.findByLeague_Id(12L)).thenReturn(List.of(gameData));
        when(gameWeekService.getCurrentGameweek()).thenReturn(null);

        LeagueService service = new LeagueService(
                leagueRepository,
                gameDataRepository,
                userPointsRepository,
                gameWeekService
        );

        var result = service.getLiveLeagueDto(7);

        assertEquals("/api/users/7/team-logo?v=42", result.getUsers().getFirst().getLogoPath());
    }
}