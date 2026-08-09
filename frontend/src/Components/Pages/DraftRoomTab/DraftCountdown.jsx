import { useEffect, useMemo, useRef, useState } from "react";

import {
    getCountdownParts,
    getVisibleCountdownUnits,
} from "../../../features/status/model";

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
    const [now, setNow] = useState(null);
    const elapsedNotificationSent = useRef(false);

    useEffect(() => {
        if (!target) return undefined;
        const frame = window.requestAnimationFrame(() => setNow(Date.now()));
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => {
            window.cancelAnimationFrame(frame);
            window.clearInterval(timer);
        };
    }, [target]);

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
            <div className="flex w-full min-w-0 items-center gap-1.5" role="timer" aria-live="off" aria-label={`${readableTime} until the draft starts`}>
                {visibleUnits.map(([key, label]) => (
                    <span key={key} className="inline-flex min-w-0 flex-1 items-baseline justify-center gap-0.5 rounded-lg bg-app-surface px-1.5 py-1.5 ring-1 ring-app-border">
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
