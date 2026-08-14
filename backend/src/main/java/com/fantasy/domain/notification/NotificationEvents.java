package com.fantasy.domain.notification;

public final class NotificationEvents {
    private NotificationEvents() {}

    public static NotificationEvent windowOpeningSoon(long leagueId, int gameweekId) {
        return new NotificationEvent(
                "league:" + leagueId + ":gw:" + gameweekId + ":window-opening-10m",
                "TRANSFER_WINDOW_OPENING_SOON",
                "Transfer window opens in 10 minutes",
                "Your waiver plan is ready. Join the app if you plan to make your picks live.",
                "/transfer-window",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent lineupLockSoon(long leagueId, int gameweekId) {
        return new NotificationEvent(
                "league:" + leagueId + ":gw:" + gameweekId + ":lineup-lock-10m",
                "LINEUP_LOCK_SOON",
                "Lineups lock in 10 minutes",
                "Save your final squad before the deadline.",
                "/pick-team",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent windowOpened(long windowId, int gameweekId) {
        return new NotificationEvent(
                "window:" + windowId + ":opened",
                "TRANSFER_WINDOW_OPENED",
                "Transfer window is open",
                "Gameweek " + gameweekId + " selections are now live.",
                "/transfer-window",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent turnCompleted(long windowId, String phase, int completedCursor, String description) {
        return new NotificationEvent(
                "window:" + windowId + ":" + phase.toLowerCase() + ":turn:" + completedCursor + ":completed",
                "TRANSFER_TURN_COMPLETED",
                "Transfer turn completed",
                description,
                "/transfer-window",
                NotificationAudiencePolicy.PUSH_WHEN_INACTIVE_ONLY
        );
    }

    public static NotificationEvent yourTurn(long windowId, String phase, int cursor) {
        return new NotificationEvent(
                "window:" + windowId + ":" + phase.toLowerCase() + ":turn:" + cursor + ":started",
                "YOUR_TRANSFER_TURN",
                "It’s your turn!",
                "Open the transfer window to make your move or pass.",
                "/transfer-window",
                NotificationAudiencePolicy.PUSH_WHEN_INACTIVE_ONLY
        );
    }

    public static NotificationEvent irActivated(int userId, int gameweekId, int playerId, String manager, String player) {
        return new NotificationEvent(
                "user:" + userId + ":gw:" + gameweekId + ":ir-activated:" + playerId,
                "IR_ACTIVATED",
                "IR chip activated",
                manager + " moved " + player + " into IR.",
                "/status",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent irReleased(int userId, int gameweekId, int playerId, String manager, String player) {
        return new NotificationEvent(
                "user:" + userId + ":gw:" + gameweekId + ":ir-released:" + playerId,
                "IR_RELEASED",
                "IR player released",
                manager + " released " + player + " while returning from IR.",
                "/status",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent matchdayClosed(int gameweekId, String date) {
        return new NotificationEvent(
                "gw:" + gameweekId + ":matchday:" + date + ":closed",
                "MATCHDAY_CLOSED",
                "Matchday closed",
                "Today’s Gameweek " + gameweekId + " points have been updated.",
                "/points",
                NotificationAudiencePolicy.PUSH_WHEN_INACTIVE_ONLY
        );
    }

    public static NotificationEvent gameweekFinalized(int gameweekId) {
        return new NotificationEvent(
                "gw:" + gameweekId + ":finalized",
                "GAMEWEEK_FINALIZED",
                "Gameweek " + gameweekId + " is complete",
                "Final points have been calculated.",
                "/points",
                NotificationAudiencePolicy.PUSH_WHEN_INACTIVE_ONLY
        );
    }
}
