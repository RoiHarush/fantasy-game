"use client";

import { Clock3 } from "@/src/shared/ui/icons";
import { useEffect, useMemo, useRef } from "react";

import {
    getCountdownParts,
    getUpcomingDeadline,
    getVisibleCountdownUnits,
} from "../../../features/status/model";
import { formatAppDateTime, toAppTimestamp } from "../../../lib/dateTime";
import { useClock } from "../../../shared/hooks/useClock";
import SplitBlock from "../../Blocks/SplitBlock";

export default function UpcomingDeadlines({ gameweek, onDeadlineReached }) {
    const now = useClock();
    const previousDeadline = useRef(undefined);
    const deadlines = useMemo(() => ({
        transferWindow: toAppTimestamp(gameweek?.transferOpenTime),
        lineupLock: toAppTimestamp(gameweek?.firstKickoffTime),
    }), [gameweek?.firstKickoffTime, gameweek?.transferOpenTime]);

    const activeDeadline = now === null ? null : getUpcomingDeadline(deadlines, now);
    const activeKind = activeDeadline?.kind ?? null;

    useEffect(() => {
        if (previousDeadline.current === undefined) {
            previousDeadline.current = activeKind;
            return;
        }

        if (previousDeadline.current && previousDeadline.current !== activeKind) {
            onDeadlineReached?.();
        }
        previousDeadline.current = activeKind;
    }, [activeKind, onDeadlineReached]);

    return (
        <SplitBlock
            items={[
                {
                    id: "transfer-window",
                    title: "Transfer Window",
                    content: (
                        <DeadlineContent
                            date={gameweek?.transferOpenTime}
                        />
                    ),
                },
                {
                    id: "lineup-lock",
                    title: "Lineup Lock",
                    content: (
                        <DeadlineContent
                            date={gameweek?.firstKickoffTime}
                        />
                    ),
                },
            ]}
            footer={activeDeadline && now !== null ? (
                <Countdown
                    targetTime={activeDeadline.targetTime}
                    now={now}
                    label={activeKind === "transfer-window" ? "Transfer window opens in" : "Lineups lock in"}
                />
            ) : null}
        />
    );
}

function DeadlineContent({ date }) {
    const formattedDate = formatAppDateTime(date) ?? "TBA";

    return <p className="text-sm text-white/80 sm:text-base">{formattedDate}</p>;
}

function Countdown({ targetTime, now, label }) {
    const parts = getCountdownParts(targetTime, now);
    const visibleUnits = getVisibleCountdownUnits(parts);
    const readableTime = visibleUnits
        .map(([key, unitLabel]) => `${parts[key]}${unitLabel}`)
        .join(", ");

    return (
        <div
            role="timer"
            aria-label={`${readableTime} ${label}`}
            aria-live="off"
            className="flex min-h-11 w-full flex-col items-center justify-center gap-2 px-2 py-1 sm:flex-row sm:gap-4"
        >
            <p className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-app-muted sm:text-sm">
                <Clock3 aria-hidden="true" className="size-3.5" />
                {label}
            </p>
            <div className="flex items-center justify-center gap-1.5">
                {visibleUnits.map(([key, unitLabel]) => (
                    <span key={key} className="inline-flex min-w-12 items-baseline justify-center gap-1 rounded-lg bg-app-surface px-2 py-1.5 shadow-sm ring-1 ring-app-border">
                        <strong className="text-base leading-none font-bold tabular-nums text-app-accent sm:text-lg">
                            {String(parts[key]).padStart(2, "0")}
                        </strong>
                        <span className="text-[0.65rem] font-semibold text-app-muted uppercase">
                            {unitLabel}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}
