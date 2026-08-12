"use client";

import { useEffect, useState } from "react";

export function useClock({ enabled = true, intervalMs = 1_000 } = {}) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        if (!enabled) return undefined;

        const frame = window.requestAnimationFrame(() => setNow(Date.now()));
        const timer = window.setInterval(() => setNow(Date.now()), intervalMs);

        return () => {
            window.cancelAnimationFrame(frame);
            window.clearInterval(timer);
        };
    }, [enabled, intervalMs]);

    return enabled ? now : null;
}
