"use client";

import { CalendarClock } from "@/src/shared/ui/icons";

import {
    getCountdownParts,
    getVisibleCountdownUnits,
} from "../../../features/status/model";
import { formatAppDateTime, toAppTimestamp } from "../../../lib/dateTime";
import { useClock } from "../../../shared/hooks/useClock";

export default function TransferWindowCountdown({ value }) {
    const targetTime = toAppTimestamp(value);
    const hasScheduledOpening = Number.isFinite(targetTime);
    const now = useClock({ enabled: hasScheduledOpening });
    const isElapsed = hasScheduledOpening && now !== null && targetTime <= now;
    const parts = hasScheduledOpening && now !== null
        ? getCountdownParts(targetTime, now)
        : null;
    const visibleUnits = parts ? getVisibleCountdownUnits(parts) : [];
    const readableTime = visibleUnits
        .map(([key, label]) => `${parts[key]}${label}`)
        .join(", ");

    return (
        <div className="border-l-2 border-app-accent-border pl-4 sm:pl-5">
            <div className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-muted">
                <CalendarClock className="size-4 text-app-accent" aria-hidden="true" />
                Next window
            </div>
            <p className="mt-1 text-base font-black text-app-foreground sm:text-lg">
                {formatAppDateTime(value) || "Not scheduled yet"}
            </p>

            {hasScheduledOpening && now !== null && (
                <div
                    className="mt-3"
                    role="timer"
                    aria-live="off"
                    aria-label={isElapsed ? "Transfer window is opening" : `${readableTime} until the transfer window opens`}
                >
                    {isElapsed ? (
                        <p className="text-sm font-black text-app-positive-foreground">Opening now</p>
                    ) : (
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            {visibleUnits.map(([key, label]) => (
                                <span key={key} className="inline-flex items-baseline gap-1">
                                    <strong className="text-2xl leading-none font-black tabular-nums text-app-accent sm:text-3xl">
                                        {String(parts[key]).padStart(2, "0")}
                                    </strong>
                                    <span className="text-[0.6rem] font-black uppercase tracking-wider text-app-muted">
                                        {label}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
