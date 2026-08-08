package com.fantasy.domain.transfer;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.player.PlayerEntity;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupplementalDraftPoolServiceTest {

    @Test
    void reservesANewPlayerOnlyForLeaguesThatCompletedTheirInitialDraft() {
        SupplementalDraftPoolRepository poolRepository = mock(SupplementalDraftPoolRepository.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        SupplementalDraftPoolService service = new SupplementalDraftPoolService(
                poolRepository,
                leagueRepository
        );

        LeagueEntity activeLeague = league(7L, LeagueStatus.ACTIVE);
        LeagueEntity liveInitialDraft = league(8L, LeagueStatus.DRAFT_LIVE);
        LeagueEntity waitingLeague = league(9L, LeagueStatus.WAITING_FOR_DRAFT);
        PlayerEntity player = new PlayerEntity();
        player.setId(501);
        LocalDateTime discoveredAt = LocalDateTime.of(2027, 1, 4, 12, 0);
        player.setFirstSeenAt(discoveredAt);

        when(leagueRepository.findAll()).thenReturn(List.of(activeLeague, liveInitialDraft, waitingLeague));
        when(poolRepository.existsByLeague_IdAndPlayer_Id(7L, 501)).thenReturn(false);
        when(poolRepository.existsByLeague_IdAndPlayer_Id(8L, 501)).thenReturn(true);

        service.reserveNewPlayer(player);

        ArgumentCaptor<SupplementalDraftPoolEntity> entryCaptor =
                ArgumentCaptor.forClass(SupplementalDraftPoolEntity.class);
        verify(poolRepository).save(entryCaptor.capture());
        assertEquals(7L, entryCaptor.getValue().getLeague().getId());
        assertEquals(501, entryCaptor.getValue().getPlayer().getId());
        assertEquals(discoveredAt, entryCaptor.getValue().getDiscoveredAt());
        verify(poolRepository, never()).existsByLeague_IdAndPlayer_Id(9L, 501);
    }

    @Test
    void releasesEveryRemainingPlayerWhenTheSupplementalDraftEnds() {
        SupplementalDraftPoolRepository poolRepository = mock(SupplementalDraftPoolRepository.class);
        SupplementalDraftPoolService service = new SupplementalDraftPoolService(
                poolRepository,
                mock(LeagueRepository.class)
        );

        service.releasePool(7L);

        verify(poolRepository).deleteByLeague_Id(7L);
    }

    private LeagueEntity league(long id, LeagueStatus status) {
        LeagueEntity league = new LeagueEntity();
        league.setId(id);
        league.setStatus(status);
        return league;
    }
}
