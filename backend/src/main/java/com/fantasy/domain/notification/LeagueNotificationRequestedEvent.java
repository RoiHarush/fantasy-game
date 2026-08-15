package com.fantasy.domain.notification;

import java.util.Collection;
import java.util.Set;

public record LeagueNotificationRequestedEvent(
        long leagueId,
        Integer targetUserId,
        Integer sourceUserId,
        Set<Integer> excludedUserIds,
        NotificationEvent notification
) {
    public LeagueNotificationRequestedEvent {
        excludedUserIds = excludedUserIds == null ? Set.of() : Set.copyOf(excludedUserIds);
    }

    public static LeagueNotificationRequestedEvent league(long leagueId, NotificationEvent notification) {
        return new LeagueNotificationRequestedEvent(leagueId, null, null, Set.of(), notification);
    }

    public static LeagueNotificationRequestedEvent leagueExcluding(long leagueId,
                                                                    Collection<Integer> excludedUserIds,
                                                                    NotificationEvent notification) {
        return new LeagueNotificationRequestedEvent(
                leagueId,
                null,
                null,
                excludedUserIds == null ? Set.of() : Set.copyOf(excludedUserIds),
                notification
        );
    }

    public static LeagueNotificationRequestedEvent leagueFrom(long leagueId,
                                                               int sourceUserId,
                                                               NotificationEvent notification) {
        return new LeagueNotificationRequestedEvent(leagueId, null, sourceUserId, Set.of(), notification);
    }

    public static LeagueNotificationRequestedEvent user(long leagueId, int userId, NotificationEvent notification) {
        return new LeagueNotificationRequestedEvent(leagueId, userId, null, Set.of(), notification);
    }
}
