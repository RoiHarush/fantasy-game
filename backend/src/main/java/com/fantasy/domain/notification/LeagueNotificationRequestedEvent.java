package com.fantasy.domain.notification;

public record LeagueNotificationRequestedEvent(
        long leagueId,
        Integer targetUserId,
        NotificationEvent notification
) {
    public static LeagueNotificationRequestedEvent league(long leagueId, NotificationEvent notification) {
        return new LeagueNotificationRequestedEvent(leagueId, null, notification);
    }

    public static LeagueNotificationRequestedEvent user(long leagueId, int userId, NotificationEvent notification) {
        return new LeagueNotificationRequestedEvent(leagueId, userId, notification);
    }
}
