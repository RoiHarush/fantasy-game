package com.fantasy.scheduler;

/**
 * Published after a transfer-window transaction commits. It wakes automation
 * for this league without continuously polling every league in the database.
 */
public record TransferTurnChangedEvent(long leagueId) {
}
