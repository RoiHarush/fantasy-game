package com.fantasy.scheduler;

import com.fantasy.domain.game.*;
import com.fantasy.domain.score.PointsService;

import com.fantasy.domain.team.UserGameDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class DailyPointsScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyPointsScheduler.class);
    private static final int HOURS_BUFFER = 4;

    private final GameWeekRepository gameweekRepository;
    private final FixtureRepository fixtureRepository;
    private final GameweekDailyStatusRepository dailyStatusRepository;
    private final PointsService pointsService;
    private final UserGameDataRepository userGameDataRepository;

    public DailyPointsScheduler(GameWeekRepository gameweekRepository,
                                FixtureRepository fixtureRepository,
                                GameweekDailyStatusRepository dailyStatusRepository,
                                PointsService pointsService,
                                UserGameDataRepository userGameDataRepository) {
        this.gameweekRepository = gameweekRepository;
        this.fixtureRepository = fixtureRepository;
        this.dailyStatusRepository = dailyStatusRepository;
        this.pointsService = pointsService;
        this.userGameDataRepository = userGameDataRepository;
    }

    @Scheduled(cron = "0 0/15 * * * *")
    public void processDailyPoints() {
        Optional<GameWeekEntity> liveGw = gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE");
        if (liveGw.isEmpty()) return;

        int gwId = liveGw.get().getId();

        List<LocalDate> activeDates = fixtureRepository.findByGameweekId(gwId).stream()
                .map(f -> f.getKickoffTime().toLocalDate())
                .distinct()
                .collect(Collectors.toList());

        for (LocalDate date : activeDates) {
            checkAndCalculateForDate(gwId, date);
        }
    }

    private void checkAndCalculateForDate(int gwId, LocalDate date) {
        Optional<GameweekDailyStatus> statusOpt = dailyStatusRepository.findByGameweekIdAndMatchDate(gwId, date);

        if (statusOpt.isPresent() && statusOpt.get().isCalculated()) {
            return;
        }

        if (date.isAfter(LocalDate.now())) {
            return;
        }

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        Optional<FixtureEntity> lastGame = fixtureRepository
                .findTopByKickoffTimeBetweenOrderByKickoffTimeDesc(startOfDay, endOfDay);

        if (lastGame.isEmpty()) return;

        LocalDateTime safeTime = lastGame.get().getKickoffTime().plusHours(HOURS_BUFFER);

        if (LocalDateTime.now().isBefore(safeTime)) {
            return;
        }


        GameWeekEntity gw = gameweekRepository.findById(gwId).orElseThrow();
        LocalDate lastMatchDateOfGw = gw.getLastKickoffTime().toLocalDate();

        if (date.equals(lastMatchDateOfGw)) {
            log.info("Safe time passed for Date {} (Last Day of GW {}). Skipping daily calc to let AutoScheduler handle final process.", date, gwId);
            return;
        }


        log.info("Safe time passed for Date {} in GW {}. Starting calculation...", date, gwId);

        performBulkCalculation(gwId);

        GameweekDailyStatus status = statusOpt.orElse(new GameweekDailyStatus(gwId, date));
        status.markAsCalculated();
        dailyStatusRepository.save(status);

        log.info("Date {} marked as CALCULATED.", date);
    }

    private void performBulkCalculation(int gwId) {
        userGameDataRepository.findAll().parallelStream().forEach(userGameData -> {
            try {
                pointsService.calculateAndPersist(userGameData.getUser().getId(), gwId);
            } catch (Exception e) {
                log.error("Error calculating points for user {}", userGameData.getUser().getId(), e);
            }
        });
    }
}