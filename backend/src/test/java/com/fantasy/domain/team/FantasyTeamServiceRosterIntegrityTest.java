package com.fantasy.domain.team;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.league.LeaguePlayerCatalog;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FantasyTeamServiceRosterIntegrityTest {

    @Test
    void saveTeamCannotReplaceAnOwnedPlayerThroughTheLineupPayload() {
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserGameDataEntity gameData = gameDataWithSquad();
        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));

        FantasyTeamService service = service(gameDataRepository);
        SquadDto submitted = dtoMatching(gameData.getNextSquad());
        submitted.getStartingLineup().get("MID").set(0, 99);

        assertThrows(FantasyTeamException.class, () -> service.saveTeam(7, submitted));
    }

    @Test
    void saveTeamRejectsTheSamePlayerInTwoSlots() {
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserGameDataEntity gameData = gameDataWithSquad();
        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));

        FantasyTeamService service = service(gameDataRepository);
        SquadDto submitted = dtoMatching(gameData.getNextSquad());
        submitted.getBench().put("S1", 1);

        assertThrows(FantasyTeamException.class, () -> service.saveTeam(7, submitted));
    }

    private FantasyTeamService service(UserGameDataRepository gameDataRepository) {
        return new FantasyTeamService(
                gameDataRepository,
                mock(UserSquadRepository.class),
                mock(GameWeekService.class),
                mock(UserRepository.class),
                mock(LeaguePlayerCatalog.class),
                mock(AutoSubstitutionRepository.class)
        );
    }

    private UserGameDataEntity gameDataWithSquad() {
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(new ArrayList<>(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)));
        Map<String, Integer> bench = new LinkedHashMap<>();
        bench.put("GK", 12);
        bench.put("S1", 13);
        bench.put("S2", 14);
        bench.put("S3", 15);
        squad.setBenchMap(bench);
        squad.setFirstPickId(1);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setNextSquad(squad);
        return gameData;
    }

    private SquadDto dtoMatching(UserSquadEntity squad) {
        SquadDto dto = new SquadDto();
        Map<String, List<Integer>> starting = new LinkedHashMap<>();
        starting.put("GK", new ArrayList<>(List.of(1)));
        starting.put("DEF", new ArrayList<>(List.of(2, 3, 4, 5)));
        starting.put("MID", new ArrayList<>(List.of(6, 7, 8, 9)));
        starting.put("FWD", new ArrayList<>(List.of(10, 11)));
        dto.setStartingLineup(starting);
        dto.setBench(new LinkedHashMap<>(squad.getBenchMap()));
        dto.setFirstPickId(squad.getFirstPickId());
        dto.setIrId(squad.getIrId());
        return dto;
    }
}
