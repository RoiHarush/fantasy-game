package com.fantasy.scheduler;

/**
 * Signals that a persisted lifecycle deadline or state changed and the exact
 * in-memory schedule must be rebuilt from the database.
 */
public record LifecycleScheduleChangedEvent(String reason) {
}
