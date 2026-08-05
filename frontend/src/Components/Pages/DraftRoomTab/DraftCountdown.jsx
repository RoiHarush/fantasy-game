import { useEffect, useMemo, useState } from "react";

function toDate(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = value;
        return new Date(year, month - 1, day, hour, minute, second);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function DraftCountdown({ value }) {
    const target = useMemo(() => toDate(value), [value]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!target) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [target]);

    if (!target) return <span>Waiting for the league admin to schedule the draft</span>;
    const remaining = Math.max(0, target.getTime() - now);
    if (remaining === 0) return <span>Draft is starting…</span>;

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
        <span aria-live="polite">
            {days > 0 ? `${days}d ` : ""}
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
    );
}
