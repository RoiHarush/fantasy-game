import { toAppTimestamp } from "../../lib/dateTime";

const SETTLEMENT_BUFFER_MS = 4 * 60 * 60 * 1_000;

function isFinished(gameweek) {
    return gameweek?.calculated === true || gameweek?.status === "FINISHED";
}

function gameweekStart(gameweek) {
    return toAppTimestamp(gameweek?.firstKickoffTime);
}

function gameweekExpectedSettlement(gameweek) {
    const lastKickoff = toAppTimestamp(gameweek?.lastKickoffTime);
    return lastKickoff == null ? null : lastKickoff + SETTLEMENT_BUFFER_MS;
}

export function findActiveGameweek(gameweeks = [], currentGameweek = null, now = Date.now()) {
    const candidates = currentGameweek
        ? [currentGameweek, ...gameweeks.filter((gameweek) => gameweek.id !== currentGameweek.id)]
        : gameweeks;

    return candidates.find((gameweek) => {
        if (gameweek?.status === "LIVE") return !isFinished(gameweek);
        const start = gameweekStart(gameweek);
        return !isFinished(gameweek) && start != null && now >= start;
    }) ?? null;
}

export function findGameweekScheduleConflict(gameweeks = [], value) {
    const scheduledTime = toAppTimestamp(value);
    if (scheduledTime == null) return null;

    return gameweeks.find((gameweek) => {
        if (isFinished(gameweek)) return false;
        const start = gameweekStart(gameweek);
        if (start == null || scheduledTime < start) return false;
        const settlement = gameweekExpectedSettlement(gameweek);
        return settlement == null || scheduledTime < settlement;
    }) ?? null;
}

export function gameweekLabel(gameweek) {
    return gameweek?.name || (gameweek?.id ? `Gameweek ${gameweek.id}` : "the active gameweek");
}
