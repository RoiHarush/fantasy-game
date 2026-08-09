package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WaiverPlanServiceTest {

    @Test
    void regularPlanAllowsMoreThanThirtyEntriesAndExactDuplicateCards() {
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
        WaiverPlanProgressRepository progressRepo = mock(WaiverPlanProgressRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        WaiverPlanService service = new WaiverPlanService(
                waiverRepo, progressRepo, windowRepo, leagueAccess, leagueRepo,
                gameWeekRepo, userRepo, gameDataRepo, playerRepo
        );

        UserEntity user = new UserEntity();
        user.setId(10);
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setUsers(List.of(user));
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        PlayerEntity incoming = player(200, 2);
        PlayerEntity outgoing = player(100, 1);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(100));
        squad.setBenchMap(new LinkedHashMap<>());
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setUser(user);
        gameData.setLeague(league);
        gameData.setNextSquad(squad);

        List<WaiverEntryRequest> entries = new ArrayList<>();
        for (int index = 0; index < 35; index++) {
            entries.add(new WaiverEntryRequest(200, 100));
        }

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(gameWeekRepo.findById(4)).thenReturn(Optional.of(gameWeek));
        when(gameWeekRepo.findFirstByStatusOrderByIdAsc("UPCOMING")).thenReturn(Optional.of(gameWeek));
        when(userRepo.findById(10)).thenReturn(Optional.of(user));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(outgoing));
        when(playerRepo.findById(200)).thenReturn(Optional.of(incoming));
        when(waiverRepo.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<WaiverEntryDto> saved = service.savePlan(10, 4, new SaveWaiverPlanRequest(entries));

        assertEquals(35, saved.size());
        assertEquals(200, saved.getFirst().playerInId());
        assertEquals(100, saved.getFirst().playerOutId());
        assertEquals(200, saved.getLast().playerInId());
        assertEquals(100, saved.getLast().playerOutId());
        ArgumentCaptor<List<WaiverPreferenceEntity>> captor = ArgumentCaptor.forClass(List.class);
        verify(waiverRepo).saveAll(captor.capture());
        assertEquals(35, captor.getValue().size());
        assertEquals(35, captor.getValue().getLast().getPriority());
        verify(progressRepo).save(any(WaiverPlanProgressEntity.class));
    }

    private PlayerEntity player(int id, int teamId) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setTeamId(teamId);
        player.setPosition(PlayerPosition.DEFENDER);
        return player;
    }
}
