import { getNextTransferGameweek } from "../gameweeks/model";

export function getRankLabel(rank) {
    if (!Number.isInteger(rank) || rank < 1) return "-";

    const lastTwoDigits = rank % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${rank}th`;

    switch (rank % 10) {
        case 1: return `${rank}st`;
        case 2: return `${rank}nd`;
        case 3: return `${rank}rd`;
        default: return `${rank}th`;
    }
}

export function deriveStatusGameweekView({
    gameweeks = [],
    currentGameweek,
    nextGameweek,
    lastGameweek,
}) {
    const resolvedCurrent = currentGameweek
        ?? gameweeks.find(gameweek => gameweek.status === "LIVE")
        ?? null;
    const resolvedNext = nextGameweek
        ?? gameweeks.find(gameweek => gameweek.status === "UPCOMING")
        ?? null;
    const resolvedLast = lastGameweek
        ?? [...gameweeks].reverse().find(gameweek => gameweek.status === "FINISHED")
        ?? null;
    const preSeason = !resolvedLast
        && !resolvedCurrent
        && resolvedNext?.status === "UPCOMING";
    const seasonComplete = Boolean(resolvedLast && !resolvedCurrent && !resolvedNext);
    const displayedGameweek = resolvedCurrent
        ?? (preSeason ? resolvedNext : resolvedLast ?? resolvedNext)
        ?? null;
    const transferHistoryGameweekId = resolvedCurrent?.status === "LIVE"
        ? resolvedCurrent.id
        : resolvedNext?.transferWindowProcessed
            ? resolvedNext.id
            : resolvedCurrent?.id ?? resolvedLast?.id ?? resolvedNext?.id ?? null;
    const nextTransferGameweek = getNextTransferGameweek({
        gameweeks,
        nextGameweek: resolvedNext,
    });

    return {
        displayedGameweek,
        nextTransferGameweek,
        preSeason,
        seasonComplete,
        transferHistoryGameweekId,
    };
}

export function splitTransferActions(actions = []) {
    const ordered = actions
        .map((action, originalIndex) => ({ action, originalIndex }))
        .sort((left, right) => compareTransferActionOrder(left, right))
        .map(({ action }, index) => ({ ...action, sequence: index + 1 }));

    return {
        regular: ordered.filter((action) => !isIrTransferSource(action.source)),
        ir: ordered.filter((action) => isIrTransferSource(action.source)),
    };
}

export function isIrTransferSource(source) {
    return source === "IR" || source === "IR_MANUAL" || source === "IR_WAIVER";
}

export function getIrTransferSourceLabel(source) {
    if (source === "IR_WAIVER") return "Waiver";
    if (source === "IR_MANUAL") return "Manual";
    return "IR";
}

function compareTransferActionOrder(left, right) {
    const leftId = Number(left.action.id);
    const rightId = Number(right.action.id);
    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) {
        return leftId - rightId;
    }

    const leftTime = Date.parse(left.action.createdAt);
    const rightTime = Date.parse(right.action.createdAt);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
        return leftTime - rightTime;
    }

    return left.originalIndex - right.originalIndex;
}

export function getUpcomingDeadline({ transferWindow, lineupLock }, now) {
    return [
        { kind: "transfer-window", targetTime: transferWindow },
        { kind: "lineup-lock", targetTime: lineupLock },
    ]
        .filter(({ targetTime }) => Number.isFinite(targetTime) && targetTime > now)
        .sort((left, right) => left.targetTime - right.targetTime)[0] ?? null;
}

export function getCountdownParts(targetTime, now) {
    const totalSeconds = Math.max(0, Math.ceil((targetTime - now) / 1000));

    return {
        days: Math.floor(totalSeconds / 86_400),
        hours: Math.floor((totalSeconds % 86_400) / 3_600),
        minutes: Math.floor((totalSeconds % 3_600) / 60),
        seconds: totalSeconds % 60,
    };
}

export function getVisibleCountdownUnits(parts) {
    if (parts.days > 0) return [["days", "d"], ["hours", "h"], ["minutes", "m"]];
    if (parts.hours > 0) return [["hours", "h"], ["minutes", "m"]];
    return [["minutes", "m"], ["seconds", "s"]];
}
