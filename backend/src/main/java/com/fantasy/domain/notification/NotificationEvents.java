package com.fantasy.domain.notification;

public final class NotificationEvents {
    private NotificationEvents() {}

    public static NotificationEvent windowOpeningSoon(long leagueId, int gameweekId) {
        return new NotificationEvent(
                "league:" + leagueId + ":gw:" + gameweekId + ":window-opening-10m",
                "TRANSFER_WINDOW_OPENING_SOON",
                "Transfer window opens in 10 minutes",
                "The Gameweek " + gameweekId + " transfer window opens in 10 minutes. Your waiver plan is ready.",
                "/transfer-window",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent lineupLockSoon(long leagueId, int gameweekId) {
        return new NotificationEvent(
                "league:" + leagueId + ":gw:" + gameweekId + ":lineup-lock-10m",
                "LINEUP_LOCK_SOON",
                "Gameweek " + gameweekId + " lineups lock in 10 minutes",
                "Save your final squad before the Gameweek " + gameweekId + " deadline.",
                "/pick-team",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent draftOpeningSoon(long leagueId,
                                                      long draftConfigId,
                                                      long scheduledEpochSecond,
                                                      boolean supplemental) {
        String draftLabel = supplemental ? "Mid-season draft" : "Initial draft";
        return new NotificationEvent(
                "league:" + leagueId + ":draft:" + draftConfigId
                        + ":at:" + scheduledEpochSecond + ":opening-10m",
                supplemental ? "SUPPLEMENTAL_DRAFT_OPENING_SOON" : "INITIAL_DRAFT_OPENING_SOON",
                draftLabel + " starts in 10 minutes",
                "Open the Draft Room and get ready before the " + draftLabel.toLowerCase() + " begins.",
                "/draft-room",
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

    public static NotificationEvent draftOpened(long windowId, int gameweekId, boolean supplemental) {
        String draftLabel = supplemental ? "Mid-season draft" : "Initial draft";
        return new NotificationEvent(
                "window:" + windowId + ":opened",
                supplemental ? "SUPPLEMENTAL_DRAFT_OPENED" : "INITIAL_DRAFT_OPENED",
                draftLabel + " is open",
                supplemental
                        ? "The Gameweek " + gameweekId + " mid-season draft is live."
                        : "The league’s initial squad draft is live.",
                "/draft-room",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent yourDraftTurn(long windowId,
                                                   String phase,
                                                   int cursor,
                                                   boolean supplemental) {
        return new NotificationEvent(
                "window:" + windowId + ":" + phase.toLowerCase() + ":turn:" + cursor + ":started",
                supplemental ? "YOUR_SUPPLEMENTAL_DRAFT_TURN" : "YOUR_INITIAL_DRAFT_TURN",
                "It’s your draft turn!",
                supplemental
                        ? "Open the Draft Room to make your move or pass."
                        : "Open the Draft Room to make your pick.",
                "/draft-room",
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

    public static NotificationEvent tradeOffered(long offerId, String proposer) {
        return new NotificationEvent(
                "trade:" + offerId + ":offered",
                "TRADE_OFFERED",
                "New trade offer",
                proposer + " sent you a trade offer.",
                "/trades",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent tradeAccepted(long offerId, String recipient) {
        return new NotificationEvent(
                "trade:" + offerId + ":accepted",
                "TRADE_ACCEPTED",
                "Trade accepted",
                recipient + " accepted your trade offer.",
                "/trades",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }

    public static NotificationEvent tradeRejected(long offerId, String recipient) {
        return new NotificationEvent(
                "trade:" + offerId + ":rejected",
                "TRADE_REJECTED",
                "Trade declined",
                recipient + " declined your trade offer.",
                "/trades",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
    }
}
