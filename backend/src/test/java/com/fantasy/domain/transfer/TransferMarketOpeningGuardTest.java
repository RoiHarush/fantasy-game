package com.fantasy.domain.transfer;

import com.fantasy.config.WebSocketPresenceService;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameweekActivityPolicy;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransferMarketOpeningGuardTest {

    @Test
    void refusesManualTransferOpeningWhileAnyGameweekIsActive() {
        GameWeekRepository gameweekRepo = mock(GameWeekRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class),
                gameweekRepo,
                mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class),
                mock(UserRepository.class),
                leagueRepo,
                mock(LeagueAccessService.class),
                windowRepo,
                mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class),
                mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class),
                mock(WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setStatus(LeagueStatus.ACTIVE);
        GameWeekEntity target = gameweek(2, "UPCOMING", LocalDateTime.now().plusDays(4));
        GameWeekEntity live = gameweek(1, "LIVE", LocalDateTime.now().minusHours(1));
        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(gameweekRepo.findByIdWithLock(2)).thenReturn(Optional.of(target));
        when(gameweekRepo.findAll()).thenReturn(List.of(live, target));

        assertThrows(
                GameweekActivityPolicy.GameweekActiveException.class,
                () -> service.openTransferWindow(7L, 2)
        );
        verify(windowRepo, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }

    private GameWeekEntity gameweek(int id, String status, LocalDateTime firstKickoff) {
        return new GameWeekEntity(
                id,
                "Gameweek " + id,
                firstKickoff,
                firstKickoff.plusDays(2),
                status
        );
    }
}
