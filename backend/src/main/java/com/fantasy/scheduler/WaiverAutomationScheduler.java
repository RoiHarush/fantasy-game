package com.fantasy.scheduler;

import com.fantasy.domain.transfer.TransferMarketService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true")
public class WaiverAutomationScheduler {

    private static final Logger log = LoggerFactory.getLogger(WaiverAutomationScheduler.class);

    private final TransferMarketService transferMarketService;

    public WaiverAutomationScheduler(TransferMarketService transferMarketService) {
        this.transferMarketService = transferMarketService;
    }

    @Scheduled(fixedDelayString = "${app.waivers.poll-millis:5000}")
    public void processOfflineTurns() {
        for (Long leagueId : transferMarketService.getOpenLeagueIds()) {
            try {
                transferMarketService.processOfflineTurn(leagueId);
            } catch (RuntimeException exception) {
                log.error("Failed to process offline waiver turn for league {}", leagueId, exception);
            }
        }
    }
}
