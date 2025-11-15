package com.fantasy.scheduler;

import com.fantasy.application.*;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.user.User;
import com.fantasy.main.InMemoryData;

import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Service
public class GameweekScheduler {

    private final GameWeekService gameWeekService;
    private final TransferWindowService transferWindowService;
    private final PlayerService playerService;
    private final PointsService pointsService;
    private final GameweekManager gameweekManager;
    private final TaskScheduler scheduler;

    public GameweekScheduler(GameWeekService gameWeekService,
                             TransferWindowService transferWindowService,
                             PlayerService playerService,
                             PointsService pointsService,
                             GameweekManager gameweekManager) {
        this.gameWeekService = gameWeekService;
        this.transferWindowService = transferWindowService;
        this.playerService = playerService;
        this.pointsService = pointsService;
        this.gameweekManager = gameweekManager;

        ThreadPoolTaskScheduler t = new ThreadPoolTaskScheduler();
        t.setPoolSize(5);
        t.initialize();
        this.scheduler = t;
    }

    public void scheduleAllGameweeks() {
        List<GameWeekEntity> all = gameWeekService.getAllGameweeks();

        for (int i = 0; i < all.size(); i++) {
            GameWeekEntity gw = all.get(i);
            if (!"FINISHED".equalsIgnoreCase(gw.getStatus())) {
                scheduleTransferWindow(gw);
                scheduleLiveUpdates(gw);
                scheduleGameweekProcessing(gw);

                if (i + 1 < all.size()) {
                    GameWeekEntity nextGw = all.get(i + 1);
                    scheduleNextGameweekOpening(gw, nextGw);
                }
            }
        }
    }

    private void scheduleTransferWindow(GameWeekEntity gw) {
        if (gw.getTransferOpenTime() == null) return;

        Instant openInstant = gw.getTransferOpenTime()
                .atZone(ZoneId.systemDefault())
                .toInstant();

        scheduler.schedule(() -> {
            System.out.println("🕓 Opening transfer window for GW" + gw.getId());
            transferWindowService.openTransferWindow(gw.getId());
        }, Date.from(openInstant));
    }

    private void scheduleLiveUpdates(GameWeekEntity gw) {
        if (gw.getFirstKickoffTime() == null || gw.getLastKickoffTime() == null) return;

        Instant start = gw.getFirstKickoffTime()
                .atZone(ZoneId.systemDefault())
                .toInstant();

        Instant end = gw.getLastKickoffTime()
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .plus(3, ChronoUnit.HOURS);

        scheduler.schedule(() -> startLiveUpdateLoop(gw, end), Date.from(start));
    }

    private void startLiveUpdateLoop(GameWeekEntity gw, Instant endTime) {
        System.out.println("⚽ Starting live updates for GW" + gw.getId());

        scheduler.scheduleAtFixedRate(() -> {
            if (Instant.now().isAfter(endTime)) {
                System.out.println("🏁 Stopping live updates for GW" + gw.getId());
                return;
            }

            try {
                playerService.updateLiveGameweekStats(gw.getId());

                for (User user : InMemoryData.getUsers().getUsers()) {
                    pointsService.calculateAndPersist(user.getId(), gw.getId());
                }

                System.out.println("✅ Updated live stats and points for GW " + gw.getId());
            } catch (Exception e) {
                System.err.println("❌ Error during live update for GW " + gw.getId());
                e.printStackTrace();
            }

        }, 60_000); // כל 60 שניות
    }

    private void scheduleGameweekProcessing(GameWeekEntity gw) {
        if (gw.getLastKickoffTime() == null) return;

        Instant processTime = gw.getLastKickoffTime()
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .plus(3, ChronoUnit.HOURS);

        scheduler.schedule(() -> {
            System.out.println("🔒 Processing end of GW" + gw.getId());

            try {
                gameweekManager.processGameweek(gw.getId());
                System.out.println("✅ Processed GW" + gw.getId());
            } catch (Exception e) {
                System.err.println("❌ Error processing GW" + gw.getId());
                e.printStackTrace();
            }

        }, Date.from(processTime));
    }

    private void scheduleNextGameweekOpening(GameWeekEntity currentGw, GameWeekEntity nextGw) {
        if (nextGw.getFirstKickoffTime() == null) return;

        Instant openTime = nextGw.getFirstKickoffTime()
                .atZone(ZoneId.systemDefault())
                .toInstant();

        scheduler.schedule(() -> {
            System.out.println("🚀 Opening next Gameweek " + nextGw.getId() +
                    " (after GW" + currentGw.getId() + ")");

            try {
                gameweekManager.openNextGameweek(nextGw.getId());
                System.out.println("✅ GW" + nextGw.getId() + " is now LIVE!");
            } catch (Exception e) {
                System.err.println("❌ Error opening GW" + nextGw.getId());
                e.printStackTrace();
            }

        }, Date.from(openTime));
    }
}
