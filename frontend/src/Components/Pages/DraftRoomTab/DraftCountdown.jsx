import { useEffect, useMemo, useRef } from "react";

import {
    getCountdownParts,
    getVisibleCountdownUnits,
} from "../../../features/status/model";
import { useClock } from "../../../shared/hooks/useClock";

function toDate(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = value;
        return new Date(year, month - 1, day, hour, minute, second);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function DraftCountdown({ value, onElapsed, variant = "inline" }) {
    const target = useMemo(() => toDate(value), [value]);
    const now = useClock({ enabled: Boolean(target) });
    const elapsedNotificationSent = useRef(false);

    const hasElapsed = Boolean(target && now !== null && target.getTime() <= now);

    useEffect(() => {
        elapsedNotificationSent.current = false;
    }, [target]);

    useEffect(() => {
        if (!hasElapsed || elapsedNotificationSent.current) return;
        elapsedNotificationSent.current = true;
        onElapsed?.();
    }, [hasElapsed, onElapsed]);

    if (!target) return <span>Waiting for the league admin to schedule the draft</span>;
    if (now === null) return <span>Loading draft countdown...</span>;
    const remaining = Math.max(0, target.getTime() - now);
    if (remaining === 0) return <span role="status">Draft is starting…</span>;

    if (variant === "units") {
        const parts = getCountdownParts(target.getTime(), now);
        const visibleUnits = getVisibleCountdownUnits(parts);
        const readableTime = visibleUnits
            .map(([key, label]) => `${parts[key]}${label}`)
            .join(", ");

        return (
            <div
                className="grid w-full min-w-0 items-center gap-1.5"
                style={{ gridTemplateColumns: `repeat(${visibleUnits.length}, minmax(0, 1fr))` }}
                role="timer"
                aria-live="off"
                aria-label={`${readableTime} until the draft starts`}
            >
                {visibleUnits.map(([key, label]) => (
                    <span key={key} className="inline-flex min-w-0 items-baseline justify-center gap-0.5 overflow-hidden rounded-lg bg-app-surface px-1 py-1.5 ring-1 ring-app-border">
                        <strong className="text-sm leading-none font-black tabular-nums text-app-accent sm:text-base">
                            {String(parts[key]).padStart(2, "0")}
                        </strong>
                        <span className="text-[0.55rem] font-bold uppercase text-app-muted">{label}</span>
                    </span>
                ))}
            </div>
        );
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
        <span role="timer" aria-live="off">
            {days > 0 ? `${days}d ` : ""}
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
    );
}
