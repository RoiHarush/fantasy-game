package com.fantasy.scheduler;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameweekActivityPolicy;
import com.fantasy.domain.game.GameweekDailyStatusRepository;
import com.fantasy.domain.transfer.DraftConfig;
import com.fantasy.domain.transfer.DraftConfigRepository;
import com.fantasy.domain.transfer.DraftService;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Maintains exact, one-shot lifecycle tasks while keeping the database as the
 * source of truth. Nothing important relies on an in-memory timer surviving a
 * restart: startup reconciliation rebuilds every pending task from persisted
 * statuses and deadlines, and overdue work is retried in dependency order.
 */
@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true")
public class LifecycleScheduleCoordinator {

    private static final Logger log = LoggerFactory.getLogger(LifecycleScheduleCoordinator.class);
    private static final ZoneId LEAGUE_ZONE = ZoneId.of("Asia/Jerusalem");
    private static final Duration SHORT_RETRY = Duration.ofMinutes(1);
    private static final Duration FPL_CONFIRMATION_RETRY = Duration.ofMinutes(15);
    private static final Duration DRAFT_RETRY = Duration.ofSeconds(30);
    private static final Duration FPL_PREFLIGHT_LEAD = Duration.ofMinutes(2);
    private static final int FPL_PREFLIGHT_PRIORITY = 1;
    private static final int FINALIZE_PRIORITY = 10;
    private static final int DAILY_POINTS_PRIORITY = 20;
    private static final int NOTIFICATION_PRIORITY = 25;
    private static final int OPEN_GAMEWEEK_PRIORITY = 30;
    private static final int OPEN_TRANSFER_PRIORITY = 40;
    private static final int OPEN_DRAFT_PRIORITY = 50;

    private final ThreadPoolTaskScheduler scheduler;
    private final GameWeekRepository gameWeekRepository;
    private final FixtureRepository fixtureRepository;
    private final GameweekDailyStatusRepository dailyStatusRepository;
    private final DraftConfigRepository draftConfigRepository;
    private final GameweekAutoScheduler gameweekAutoScheduler;
    private final DailyPointsScheduler dailyPointsScheduler;
    private final TransferWindowScheduler transferWindowScheduler;
    private final DraftService draftService;
    private final DataSyncScheduler dataSyncScheduler;
    private ScheduledNotificationService scheduledNotificationService;

    private final ReentrantLock reconciliationLock = new ReentrantLock();
    private final AtomicBoolean reconciliationQueued = new AtomicBoolean();
    private final Map<String, Registration> registrations = new HashMap<>();
    private final Map<String, Instant> lastAttempts = new HashMap<>();

    public LifecycleScheduleCoordinator(
            @Qualifier("fantasyLifecycleTaskScheduler") ThreadPoolTaskScheduler scheduler,
            GameWeekRepository gameWeekRepository,
            FixtureRepository fixtureRepository,
            GameweekDailyStatusRepository dailyStatusRepository,
            DraftConfigRepository draftConfigRepository,
            GameweekAutoScheduler gameweekAutoScheduler,
            DailyPointsScheduler dailyPointsScheduler,
            TransferWindowScheduler transferWindowScheduler,
            DraftService draftService,
            DataSyncScheduler dataSyncScheduler) {
        this.scheduler = scheduler;
        this.gameWeekRepository = gameWeekRepository;
        this.fixtureRepository = fixtureRepository;
        this.dailyStatusRepository = dailyStatusRepository;
        this.draftConfigRepository = draftConfigRepository;
        this.gameweekAutoScheduler = gameweekAutoScheduler;
        this.dailyPointsScheduler = dailyPointsScheduler;
        this.transferWindowScheduler = transferWindowScheduler;
        this.draftService = draftService;
        this.dataSyncScheduler = dataSyncScheduler;
    }

    @Autowired
    void setScheduledNotificationService(ScheduledNotificationService scheduledNotificationService) {
        this.scheduledNotificationService = scheduledNotificationService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recoverAfterStartup() {
        requestReconciliation("application startup");
    }

    @EventListener
    public void persistedScheduleChanged(LifecycleScheduleChangedEvent event) {
        requestReconciliation(event.reason());
    }

    public void requestReconciliation(String reason) {
        if (!reconciliationQueued.compareAndSet(false, true)) {
            return;
        }
        scheduler.execute(() -> {
            reconciliationQueued.set(false);
            reconcile(reason);
        });
    }

    void reconcile(String reason) {
        if (!reconciliationLock.tryLock()) {
            requestReconciliation("concurrent lifecycle change");
            return;
        }
        try {
            List<PlannedTask> desired = buildPlan();
            synchronizeRegistrations(desired);
            log.info("Lifecycle schedule reconciled from database (reason={}, pendingTasks={})",
                    reason, desired.size());
        } catch (RuntimeException exception) {
            log.error("Failed to reconcile lifecycle schedule from database (reason={})", reason, exception);
            scheduler.schedule(
                    () -> requestReconciliation("reconciliation retry"),
                    Instant.now().plus(SHORT_RETRY)
            );
        } finally {
            reconciliationLock.unlock();
        }
    }

    private List<PlannedTask> buildPlan() {
        List<PlannedTask> tasks = new ArrayList<>();

        gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE")
                .filter(gameweek -> !gameweek.isCalculated())
                .ifPresent(gameweek -> addLiveGameweekTasks(tasks, gameweek));

        gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING")
                .ifPresent(gameweek -> addUpcomingGameweekTasks(tasks, gameweek));

        for (DraftConfig config : draftConfigRepository.findAllByProcessedFalse()) {
            if (config.getScheduledTime() == null || config.getLeague() == null) {
                continue;
            }
            long leagueId = config.getLeague().getId();
            Instant draftStart = toInstant(config.getScheduledTime());
            if (scheduledNotificationService != null
                    && Instant.now().isBefore(draftStart)
                    && !scheduledNotificationService.draftOpeningSoonComplete(
                            leagueId,
                            config.getId(),
                            draftStart.getEpochSecond(),
                            config.getDraftType()
                    )) {
                tasks.add(new PlannedTask(
                        "notification:draft-open-10m:" + config.getId(),
                        draftStart.minus(Duration.ofMinutes(10)),
                        NOTIFICATION_PRIORITY,
                        SHORT_RETRY,
                        () -> scheduledNotificationService.draftOpeningSoon(
                                leagueId,
                                config.getId(),
                                draftStart.getEpochSecond(),
                                config.getDraftType()
                        )
                ));
            }
            tasks.add(new PlannedTask(
                    "draft:" + config.getId(),
                    draftStart,
                    OPEN_DRAFT_PRIORITY,
                    DRAFT_RETRY,
                    () -> draftService.runScheduledDraft(config.getId(), leagueId)
            ));
        }

        Instant now = Instant.now();
        tasks.sort((first, second) -> compareExecutionOrder(first, second, now));
        return tasks;
    }

    private int compareExecutionOrder(PlannedTask first, PlannedTask second, Instant now) {
        boolean firstOverdue = !first.target().isAfter(now);
        boolean secondOverdue = !second.target().isAfter(now);
        if (firstOverdue != secondOverdue) {
            return firstOverdue ? -1 : 1;
        }
        if (firstOverdue) {
            int priority = Integer.compare(first.priority(), second.priority());
            if (priority != 0) return priority;
        }
        int deadline = first.target().compareTo(second.target());
        if (deadline != 0) return deadline;
        int priority = Integer.compare(first.priority(), second.priority());
        return priority != 0 ? priority : first.key().compareTo(second.key());
    }

    private void addLiveGameweekTasks(List<PlannedTask> tasks, GameWeekEntity gameweek) {
        if (gameweek.getLastKickoffTime() != null) {
            tasks.add(new PlannedTask(
                    "gameweek-finalize:" + gameweek.getId(),
                    toInstant(gameweek.getLastKickoffTime().plusHours(4)),
                    FINALIZE_PRIORITY,
                    FPL_CONFIRMATION_RETRY,
                    gameweekAutoScheduler::finalizeDueGameweek
            ));
        }

        List<FixtureEntity> fixtures = fixtureRepository.findByGameweekId(gameweek.getId()).stream()
                .filter(fixture -> fixture.getKickoffTime() != null)
                .toList();
        LocalDate finalMatchDate = gameweek.getLastKickoffTime() == null
                ? null
                : gameweek.getLastKickoffTime().toLocalDate();
        Map<LocalDate, LocalDateTime> lastKickoffByDate = new HashMap<>();
        for (FixtureEntity fixture : fixtures) {
            LocalDateTime kickoff = fixture.getKickoffTime();
            lastKickoffByDate.merge(kickoff.toLocalDate(), kickoff,
                    (current, candidate) -> candidate.isAfter(current) ? candidate : current);
        }
        lastKickoffByDate.forEach((date, lastKickoff) -> {
            if (date.equals(finalMatchDate)) {
                return;
            }
            boolean calculated = dailyStatusRepository
                    .findByGameweekIdAndMatchDate(gameweek.getId(), date)
                    .map(status -> status.isCalculated())
                    .orElse(false);
            if (!calculated) {
                tasks.add(new PlannedTask(
                        "daily-points:" + gameweek.getId() + ":" + date,
                        toInstant(lastKickoff.plusHours(4)),
                        DAILY_POINTS_PRIORITY,
                        FPL_CONFIRMATION_RETRY,
                        dailyPointsScheduler::processDailyPoints
                ));
            }
        });
    }

    private void addUpcomingGameweekTasks(List<PlannedTask> tasks, GameWeekEntity gameweek) {
        if (gameweek.getFirstKickoffTime() != null) {
            Instant firstKickoff = toInstant(gameweek.getFirstKickoffTime());
            if (scheduledNotificationService != null
                    && Instant.now().isBefore(firstKickoff)
                    && !scheduledNotificationService.lineupLockSoonComplete(gameweek)) {
                tasks.add(new PlannedTask(
                        "notification:lineup-lock-10m:" + gameweek.getId(),
                        firstKickoff.minus(Duration.ofMinutes(10)),
                        NOTIFICATION_PRIORITY,
                        SHORT_RETRY,
                        () -> scheduledNotificationService.lineupLockSoon(gameweek)
                ));
            }
            tasks.add(new PlannedTask(
                    "fpl-preflight:gameweek-open:" + gameweek.getId(),
                    toInstant(gameweek.getFirstKickoffTime()).minus(FPL_PREFLIGHT_LEAD),
                    FPL_PREFLIGHT_PRIORITY,
                    FPL_CONFIRMATION_RETRY,
                    dataSyncScheduler::syncFixtureScheduleOnly
            ));
            tasks.add(new PlannedTask(
                    "gameweek-open:" + gameweek.getId(),
                    toInstant(gameweek.getFirstKickoffTime()),
                    OPEN_GAMEWEEK_PRIORITY,
                    SHORT_RETRY,
                    gameweekAutoScheduler::openDueGameweek
            ));
        }
        if (GameweekActivityPolicy.supportsRegularTransferWindow(gameweek)
                && !gameweek.isTransferWindowProcessed()
                && gameweek.getTransferOpenTime() != null) {
            Instant transferOpen = toInstant(gameweek.getTransferOpenTime());
            if (scheduledNotificationService != null
                    && Instant.now().isBefore(transferOpen)
                    && !scheduledNotificationService.transferWindowOpeningSoonComplete(gameweek)) {
                tasks.add(new PlannedTask(
                        "notification:transfer-open-10m:" + gameweek.getId(),
                        transferOpen.minus(Duration.ofMinutes(10)),
                        NOTIFICATION_PRIORITY,
                        SHORT_RETRY,
                        () -> scheduledNotificationService.transferWindowOpeningSoon(gameweek)
                ));
            }
            tasks.add(new PlannedTask(
                    "fpl-preflight:transfer-open:" + gameweek.getId(),
                    toInstant(gameweek.getTransferOpenTime()).minus(FPL_PREFLIGHT_LEAD),
                    FPL_PREFLIGHT_PRIORITY,
                    FPL_CONFIRMATION_RETRY,
                    dataSyncScheduler::syncFixtureScheduleOnly
            ));
            tasks.add(new PlannedTask(
                    "transfer-open:" + gameweek.getId(),
                    toInstant(gameweek.getTransferOpenTime()),
                    OPEN_TRANSFER_PRIORITY,
                    SHORT_RETRY,
                    transferWindowScheduler::checkAndOpenTransferWindow
            ));
        }
    }

    private void synchronizeRegistrations(List<PlannedTask> desired) {
        Set<String> desiredKeys = new HashSet<>();
        for (PlannedTask task : desired) {
            desiredKeys.add(task.key());
        }

        for (String key : new HashSet<>(registrations.keySet())) {
            if (!desiredKeys.contains(key)) {
                cancelRegistration(key);
                lastAttempts.remove(key);
            }
        }

        for (PlannedTask task : desired) {
            Registration existing = registrations.get(task.key());
            if (existing != null
                    && existing.target().equals(task.target())
                    && !existing.future().isDone()
                    && !existing.future().isCancelled()) {
                continue;
            }
            cancelRegistration(task.key());
            schedule(task);
        }
    }

    private void schedule(PlannedTask task) {
        Instant now = Instant.now();
        Instant fireAt = task.target();
        if (!fireAt.isAfter(now)) {
            Instant lastAttempt = lastAttempts.get(task.key());
            fireAt = lastAttempt == null
                    ? now
                    : laterOf(now, lastAttempt.plus(task.retryDelay()));
        }

        UUID token = UUID.randomUUID();
        ScheduledFuture<?> future = scheduler.schedule(() -> execute(task, token), fireAt);
        if (future == null) {
            throw new IllegalStateException("Lifecycle scheduler rejected task " + task.key());
        }
        registrations.put(task.key(), new Registration(token, task.target(), future));
        log.info("Scheduled lifecycle task {} for {} (sourceDeadline={})",
                task.key(), fireAt, task.target());
    }

    private void execute(PlannedTask task, UUID token) {
        reconciliationLock.lock();
        try {
            Registration current = registrations.get(task.key());
            if (current == null || !current.token().equals(token)) {
                return;
            }
            registrations.remove(task.key());
            lastAttempts.put(task.key(), Instant.now());
        } finally {
            reconciliationLock.unlock();
        }

        try {
            log.info("Executing lifecycle task {}", task.key());
            task.action().run();
        } catch (RuntimeException exception) {
            log.error("Lifecycle task {} failed; persisted state will be retried", task.key(), exception);
        } finally {
            requestReconciliation("task completed: " + task.key());
        }
    }

    private void cancelRegistration(String key) {
        Registration registration = registrations.remove(key);
        if (registration != null) {
            registration.future().cancel(false);
        }
    }

    private Instant toInstant(LocalDateTime value) {
        return value.atZone(LEAGUE_ZONE).toInstant();
    }

    private Instant laterOf(Instant first, Instant second) {
        return first.isAfter(second) ? first : second;
    }

    @PreDestroy
    public void cancelPendingTasks() {
        reconciliationLock.lock();
        try {
            registrations.values().forEach(registration -> registration.future().cancel(false));
            registrations.clear();
        } finally {
            reconciliationLock.unlock();
        }
    }

    private record PlannedTask(
            String key,
            Instant target,
            int priority,
            Duration retryDelay,
            Runnable action) {
    }

    private record Registration(UUID token, Instant target, ScheduledFuture<?> future) {
    }
}
