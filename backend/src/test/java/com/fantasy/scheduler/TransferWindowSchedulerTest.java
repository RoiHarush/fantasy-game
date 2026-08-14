package com.fantasy.scheduler;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.transfer.TransferMarketService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransferWindowSchedulerTest {

    @Test
    void doesNotOpenAStaleWindowAfterTheGameweekDeadline() {
        TransferMarketService market = mock(TransferMarketService.class);
        GameWeekRepository repository = mock(GameWeekRepository.class);
        TransferWindowScheduler scheduler = new TransferWindowScheduler(market, repository);
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(3);
        gameweek.setStatus("UPCOMING");
        gameweek.setTransferOpenTime(LocalDateTime.now().minusHours(2));
        gameweek.setFirstKickoffTime(LocalDateTime.now().minusHours(1));
        when(repository.findFirstByStatusOrderByIdAsc("UPCOMING")).thenReturn(Optional.of(gameweek));

        scheduler.checkAndOpenTransferWindow();

        assertTrue(gameweek.isTransferWindowProcessed());
        verify(repository).save(gameweek);
        verify(market, never()).openTransferWindowForAllLeagues(3);
    }
}
