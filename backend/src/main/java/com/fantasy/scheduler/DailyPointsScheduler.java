package com.fantasy.scheduler;

import com.fantasy.config.AfterCommitExecutor;
import com.fantasy.domain.game.*;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationEvents;
import com.fantasy.domain.score.PointsService;

import com.fantasy.domain.team.UserGameDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true")
public class DailyPointsScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyPointsScheduler.class);
    private static final int HOURS_BUFFER = 4;

    private final GameWeekRepository gameweekRepository;
    private final FixtureRepository fixtureRepository;
    private final GameweekDailyStatusRepository dailyStatusRepository;
    private final PointsService pointsService;
    private final UserGameDataRepository userGameDataRepository;
    private final FixtureService fixtureService;
    private final GameWeekService gameWeekService;
    private ApplicationEventPublisher applicationEvents = event -> { };

    public DailyPointsScheduler(GameWeekRepository gameweekRepository,
                                FixtureRepository fixtureRepository,
                                GameweekDailyStatusRepository dailyStatusRepository,
                                PointsService pointsService,
                                UserGameDataRepository userGameDataRepository,
                                FixtureService fixtureService,
                                GameWeekService gameWeekService) {
        this.gameweekRepository = gameweekRepository;
        this.fixtureRepository = fixtureRepository;
        this.dailyStatusRepository = dailyStatusRepository;
        this.pointsService = pointsService;
        this.userGameDataRepository = userGameDataRepository;
        this.fixtureService = fixtureService;
        this.gameWeekService = gameWeekService;
    }

    @Autowired
    void setApplicationEvents(ApplicationEventPublisher applicationEvents) {
        this.applicationEvents = applicationEvents;
    }

    public void processDailyPoints() {
        Optional<GameWeekEntity> liveGw = gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE");
        if (liveGw.isEmpty()) return;

        int gwId = liveGw.get().getId();

        try {
            fixtureService.updateFixturesForGameweek(gwId);
            gameWeekService.updateGameWeekDeadlines();
        } catch (RuntimeException exception) {
            log.error("Cannot settle daily points for GW {} because the FPL refresh failed", gwId, exception);
            return;
        }

        List<LocalDate> activeDates = fixtureRepository.findByGameweekId(gwId).stream()
                .filter(fixture -> fixture.getKickoffTime() != null)
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

        boolean allFixturesFinished = fixtureRepository.findByGameweekId(gwId).stream()
                .filter(fixture -> fixture.getKickoffTime() != null)
                .filter(fixture -> fixture.getKickoffTime().toLocalDate().equals(date))
                .allMatch(FixtureEntity::isFinished);
        if (!allFixturesFinished) {
            log.warn("Deferring daily point settlement for GW {} on {} until FPL confirms every fixture finished",
                    gwId, date);
            return;
        }


        GameWeekEntity gw = gameweekRepository.findById(gwId).orElseThrow();
        LocalDate lastMatchDateOfGw = gw.getLastKickoffTime().toLocalDate();

        if (date.equals(lastMatchDateOfGw)) {
            log.info("Safe time passed for Date {} (Last Day of GW {}). Skipping daily calc to let AutoScheduler handle final process.", date, gwId);
            return;
        }


        log.info("Safe time passed for Date {} in GW {}. Starting calculation...", date, gwId);

        if (!performBulkCalculation(gwId)) {
            log.error("Daily point calculation for GW {} on {} had failures; date remains pending", gwId, date);
            return;
        }

        GameweekDailyStatus status = statusOpt.orElse(new GameweekDailyStatus(gwId, date));
        status.markAsCalculated();
        dailyStatusRepository.save(status);

        userGameDataRepository.findAllWithRelations().stream()
                .filter(data -> data.getLeague() != null)
                .map(data -> data.getLeague().getId())
                .distinct()
                .forEach(leagueId -> AfterCommitExecutor.run(() -> applicationEvents.publishEvent(
                        LeagueNotificationRequestedEvent.league(
                                leagueId,
                                NotificationEvents.matchdayClosed(gwId, date.toString())
                        )
                )));

        log.info("Date {} marked as CALCULATED.", date);
    }

    private boolean performBulkCalculation(int gwId) {
        boolean allSucceeded = true;
        for (Integer userId : userGameDataRepository.findAllRealUserIds()) {
            try {
                pointsService.calculateAndPersist(userId, gwId);
            } catch (Exception e) {
                allSucceeded = false;
                log.error("Error calculating points for user {}", userId, e);
            }
        }
        return allSucceeded;
    }
}
