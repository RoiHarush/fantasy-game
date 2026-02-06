package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DraftService {
    private final UserGameDataRepository gameDataRepo;
    private final TransferMarketService marketService;
    private final GameWeekService gameWeekService;
    private final DraftConfigRepository draftConfigRepo;

    public DraftService(UserGameDataRepository gameDataRepo, TransferMarketService marketService,
                        GameWeekService gameWeekService, DraftConfigRepository draftConfigRepo) {
        this.gameDataRepo = gameDataRepo;
        this.marketService = marketService;
        this.gameWeekService = gameWeekService;
        this.draftConfigRepo = draftConfigRepo;
    }

    public DraftConfig getDraftConfig() {
        return draftConfigRepo.findById(1).orElse(null);
    }

    @Transactional
    public void deleteDraftConfig() {
        draftConfigRepo.findById(1).ifPresent(config -> {
            config.setScheduledTime(null);
            config.setProcessed(true);
            draftConfigRepo.save(config);
        });
    }

    @Transactional
    public void scheduleDraft(LocalDateTime time) {
        DraftConfig config = draftConfigRepo.findById(1).orElse(new DraftConfig());
        config.setScheduledTime(time);
        config.setProcessed(false);
        draftConfigRepo.save(config);
    }

    @Transactional
    public void runSnakeDraft() {
        List<UserGameDataEntity> standings = gameDataRepo.findAll().stream()
                .sorted(Comparator.comparingInt(UserGameDataEntity::getTotalPoints))
                .collect(Collectors.toList());

        List<Integer> snakeOrder = new ArrayList<>();

        for (UserGameDataEntity user : standings) {
            snakeOrder.add(user.getId());
        }

        List<UserGameDataEntity> reversed = new ArrayList<>(standings);
        Collections.reverse(reversed);
        for (UserGameDataEntity user : reversed) {
            snakeOrder.add(user.getId());
        }

        int nextGwId = gameWeekService.getNextGameweek().getId();

        marketService.openTransferWindow(nextGwId, true, snakeOrder);
    }

    @Scheduled(cron = "0 * * * * *")
    public void checkDraftSchedule() {
        draftConfigRepo.findById(1).ifPresent(config -> {
            if (!config.isProcessed() && LocalDateTime.now().isAfter(config.getScheduledTime())) {
                runSnakeDraft();
                config.setProcessed(true);
                draftConfigRepo.save(config);
            }
        });
    }
}