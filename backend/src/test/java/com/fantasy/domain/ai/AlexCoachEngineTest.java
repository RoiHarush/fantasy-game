package com.fantasy.domain.ai;

import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.player.*;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class AlexCoachEngineTest {

    @Test
    void buildsLegalSquadWithoutIrAndNeverReadsOpponentFuturePlan() {
        PlayerRepository players = mock(PlayerRepository.class);
        PlayerGameweekStatsRepository stats = mock(PlayerGameweekStatsRepository.class);
        PlayerFixtureStatsRepository fixtureStats = mock(PlayerFixtureStatsRepository.class);
        FixtureRepository fixtures = mock(FixtureRepository.class);
        UserGameDataRepository gameData = mock(UserGameDataRepository.class);
        LeagueTransferWindowRepository windows = mock(LeagueTransferWindowRepository.class);
        LeagueScoringService scoring = mock(LeagueScoringService.class);
        AlexCoachEngine engine = new AlexCoachEngine(players, stats, fixtureStats, fixtures, gameData, windows, scoring);

        LeagueEntity league = new LeagueEntity();
        league.setId(3L);
        List<PlayerEntity> roster = roster();
        UserSquadEntity ownSquad = squad();
        UserGameDataEntity user = new UserGameDataEntity();
        user.setId(100);
        user.setLeague(league);
        user.setNextSquad(ownSquad);

        UserGameDataEntity opponent = mock(UserGameDataEntity.class);
        when(opponent.getId()).thenReturn(200);
        when(opponent.getCurrentSquad()).thenReturn(new UserSquadEntity());
        when(gameData.findAllByLeagueIdWithSquads(3L)).thenReturn(List.of(user, opponent));
        when(players.findAllById(any())).thenReturn(roster);
        when(players.findAll()).thenReturn(roster);
        when(stats.findByGameweek(anyInt())).thenReturn(List.of());
        when(fixtureStats.findByGameweek(anyInt())).thenReturn(List.of());
        when(fixtures.findByGameweekId(anyInt())).thenReturn(List.of());
        when(windows.findByLeague_IdAndGameWeek_IdAndWindowType(any(), anyInt(), any())).thenReturn(Optional.empty());

        AlexCoachEngine.EngineResult result = engine.analyze(user, 5, null);

        Set<Integer> recommended = new HashSet<>();
        result.recommendedSquad().getStartingLineup().values().forEach(recommended::addAll);
        result.recommendedSquad().getBench().values().stream().filter(Objects::nonNull).forEach(recommended::add);
        assertAll(
                () -> assertEquals(11, result.recommendedSquad().getStartingLineup().values().stream().mapToInt(List::size).sum()),
                () -> assertEquals(15, recommended.size()),
                () -> assertFalse(recommended.contains(99)),
                () -> assertEquals(99, result.recommendedSquad().getIrId()),
                () -> assertEquals(1, result.recommendedSquad().getFormation().get("GK")),
                () -> assertTrue(result.recommendedSquad().getFormation().get("DEF") >= 3),
                () -> assertTrue(result.recommendedSquad().getFormation().get("FWD") >= 1)
        );
        verify(opponent, never()).getNextSquad();
    }

    private List<PlayerEntity> roster() {
        List<PlayerEntity> result = new ArrayList<>();
        add(result, 1, 2, PlayerPosition.GOALKEEPER);
        add(result, 3, 7, PlayerPosition.DEFENDER);
        add(result, 8, 12, PlayerPosition.MIDFIELDER);
        add(result, 13, 15, PlayerPosition.FORWARD);
        return result;
    }

    private void add(List<PlayerEntity> players, int from, int to, PlayerPosition position) {
        for (int id = from; id <= to; id++) {
            PlayerEntity player = new PlayerEntity();
            player.setId(id);
            player.setViewName("Player " + id);
            player.setPosition(position);
            player.setTeamId(id);
            player.setForm(16 - id);
            player.setPointsPerGame(5);
            player.setSelectedByPercent(20);
            players.add(player);
        }
    }

    private UserSquadEntity squad() {
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14));
        squad.setBenchMap(new LinkedHashMap<>(Map.of("GK", 2, "S1", 7, "S2", 12, "S3", 15)));
        squad.setCaptainId(8);
        squad.setViceCaptainId(9);
        squad.setFirstPickId(1);
        squad.setIrId(99);
        return squad;
    }
}
