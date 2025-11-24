//package com.fantasy.scheduler;
//
//import com.fantasy.application.GameweekManager;
//import com.fantasy.domain.game.GameWeekEntity;
//import com.fantasy.infrastructure.repositories.GameWeekRepository;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//import java.time.LocalDateTime;
//import java.util.Optional;
//
//@Component
//public class GameweekAutoScheduler {
//
//    private static final int HOURS_AFTER_LAST_KICKOFF = 4;
//
//    private final GameweekManager gameweekManager;
//    private final GameWeekRepository gameweekRepository;
//
//    public GameweekAutoScheduler(GameweekManager gameweekManager, GameWeekRepository gameweekRepository) {
//        this.gameweekManager = gameweekManager;
//        this.gameweekRepository = gameweekRepository;
//    }
//
//    @Scheduled(cron = "0 * * * * *")
//    public void runScheduler() {
//        LocalDateTime now = LocalDateTime.now();
//
//        Optional<GameWeekEntity> upcoming = gameweekRepository.findFirstByStatusOrderByIdAsc("UPCOMING");
//        if (upcoming.isPresent()) {
//            GameWeekEntity nextGw = upcoming.get();
//            if (now.isAfter(nextGw.getFirstKickoffTime()) || now.isEqual(nextGw.getFirstKickoffTime())) {
//                gameweekManager.openNextGameweek(nextGw.getId());
//            }
//        }
//
//        Optional<GameWeekEntity> live = gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE");
//        if (live.isPresent()) {
//            GameWeekEntity gw = live.get();
//            LocalDateTime safeProcessTime = gw.getLastKickoffTime().plusHours(HOURS_AFTER_LAST_KICKOFF);
//
//            if (now.isAfter(safeProcessTime) && !gw.isCalculated()) {
//                gameweekManager.processGameweek(gw.getId());
//
//                gameweekRepository.save(gw);
//            }
//        }
//    }
//}