import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useClock } from "./useClock";

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("useClock", () => {
    it("publishes the current time and keeps it moving at the requested interval", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-11T10:00:00Z"));
        vi.stubGlobal("requestAnimationFrame", (callback) => {
            callback();
            return 1;
        });
        vi.stubGlobal("cancelAnimationFrame", vi.fn());

        const { result } = renderHook(() => useClock({ intervalMs: 1_000 }));
        const initialTime = result.current;

        act(() => vi.advanceTimersByTime(1_000));

        expect(initialTime).not.toBeNull();
        expect(result.current - initialTime).toBe(1_000);
    });

    it("does not start a clock while disabled", () => {
        const { result } = renderHook(() => useClock({ enabled: false }));

        expect(result.current).toBeNull();
    });
});
