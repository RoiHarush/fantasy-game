package com.fantasy.domain.game;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.Optional;

/**
 * The single policy that protects transfer and draft windows from overlapping
 * a live gameweek. The database remains authoritative; UI checks are only an
 * early explanation for the user.
 */
public final class GameweekActivityPolicy {

    public static final int SETTLEMENT_HOURS_AFTER_LAST_KICKOFF = 4;

    private GameweekActivityPolicy() {
    }

    public static void requireCanOpenNow(Collection<GameWeekEntity> gameweeks,
                                         LocalDateTime now,
                                         String operation) {
        findActiveNow(gameweeks, now).ifPresent(gameweek -> {
            throw conflict(operation, gameweek);
        });
    }

    public static void requireCanScheduleAt(Collection<GameWeekEntity> gameweeks,
                                            LocalDateTime scheduledTime,
                                            String operation) {
        findScheduledConflict(gameweeks, scheduledTime).ifPresent(gameweek -> {
            throw conflict(operation, gameweek);
        });
    }

    public static Optional<GameWeekEntity> findActiveNow(Collection<GameWeekEntity> gameweeks,
                                                          LocalDateTime now) {
        return gameweeks.stream()
                .filter(gameweek -> isLive(gameweek) || hasStartedButNotSettled(gameweek, now))
                .min(Comparator.comparingInt(GameWeekEntity::getId));
    }

    public static Optional<GameWeekEntity> findScheduledConflict(Collection<GameWeekEntity> gameweeks,
                                                                  LocalDateTime scheduledTime) {
        return gameweeks.stream()
                .filter(gameweek -> overlapsPublishedGameweek(gameweek, scheduledTime))
                .min(Comparator.comparingInt(GameWeekEntity::getId));
    }

    private static boolean isLive(GameWeekEntity gameweek) {
        return "LIVE".equalsIgnoreCase(gameweek.getStatus()) && !gameweek.isCalculated();
    }

    private static boolean hasStartedButNotSettled(GameWeekEntity gameweek, LocalDateTime now) {
        return !gameweek.isCalculated()
                && !"FINISHED".equalsIgnoreCase(gameweek.getStatus())
                && gameweek.getFirstKickoffTime() != null
                && !now.isBefore(gameweek.getFirstKickoffTime());
    }

    private static boolean overlapsPublishedGameweek(GameWeekEntity gameweek,
                                                      LocalDateTime scheduledTime) {
        if (gameweek.isCalculated() || "FINISHED".equalsIgnoreCase(gameweek.getStatus())) {
            return false;
        }
        LocalDateTime start = gameweek.getFirstKickoffTime();
        if (start == null || scheduledTime.isBefore(start)) {
            return false;
        }
        LocalDateTime lastKickoff = gameweek.getLastKickoffTime();
        if (lastKickoff == null) {
            // Missing end data is unsafe: once this gameweek begins, an opening
            // cannot be proven to fall outside it.
            return true;
        }
        LocalDateTime expectedSettlement = lastKickoff
                .plusHours(SETTLEMENT_HOURS_AFTER_LAST_KICKOFF);
        return scheduledTime.isBefore(expectedSettlement);
    }

    private static GameweekActiveException conflict(String operation,
                                                    GameWeekEntity gameweek) {
        String label = gameweek.getName() == null || gameweek.getName().isBlank()
                ? "Gameweek " + gameweek.getId()
                : gameweek.getName();
        return new GameweekActiveException(
                operation + " is unavailable while " + label + " is active"
        );
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class GameweekActiveException extends IllegalStateException {
        public GameweekActiveException(String message) {
            super(message);
        }
    }
}
