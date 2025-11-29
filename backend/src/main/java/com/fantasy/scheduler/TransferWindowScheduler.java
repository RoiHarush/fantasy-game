package com.fantasy.scheduler;

import com.fantasy.application.TransferWindowService;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class TransferWindowScheduler {

    private static final Logger log = LoggerFactory.getLogger(TransferWindowScheduler.class);

    private final TransferWindowService transferWindowService;
    private final GameWeekRepository gameWeekRepository;

    public TransferWindowScheduler(TransferWindowService transferWindowService, GameWeekRepository gameWeekRepository) {
        this.transferWindowService = transferWindowService;
        this.gameWeekRepository = gameWeekRepository;
    }


    @Scheduled(cron = "0 * * * * *")
    public void checkAndOpenTransferWindow() {
        if (transferWindowService.isActiveWindow()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<GameWeekEntity> upcomingGwOpt = gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING");

        if (upcomingGwOpt.isPresent()) {
            GameWeekEntity nextGw = upcomingGwOpt.get();

            if (nextGw.getTransferOpenTime() == null) {
                return;
            }

            boolean timeReached = now.isAfter(nextGw.getTransferOpenTime()) || now.isEqual(nextGw.getTransferOpenTime());

            if (timeReached && !nextGw.isTransferWindowProcessed()) {

                log.info("Transfer window open time reached for GW {}", nextGw.getId());

                try {
                    transferWindowService.openTransferWindow(nextGw.getId());
                    log.info("Transfer window opened successfully.");
                } catch (Exception e) {
                    log.error("Failed to auto-open transfer window for GW {}", nextGw.getId(), e);
                }
            }
        }
    }
}