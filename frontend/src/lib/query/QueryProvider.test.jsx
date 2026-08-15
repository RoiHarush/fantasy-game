import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppResumeRecovery } from "./QueryProvider";

describe("AppResumeRecovery", () => {
    let visibilityState;

    beforeEach(() => {
        visibilityState = "visible";
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: () => visibilityState,
        });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-15T12:00:00Z"));
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it("cancels frozen active requests before refetching after a long background pause", async () => {
        const queryClient = {
            cancelQueries: vi.fn().mockResolvedValue(undefined),
            invalidateQueries: vi.fn().mockResolvedValue(undefined),
        };
        render(<AppResumeRecovery queryClient={queryClient} />);

        visibilityState = "hidden";
        fireEvent(document, new Event("visibilitychange"));
        vi.advanceTimersByTime(6_000);
        visibilityState = "visible";
        fireEvent(document, new Event("visibilitychange"));

        expect(queryClient.cancelQueries).toHaveBeenCalledWith(
            { type: "active" },
            { silent: true },
        );
        await Promise.resolve();
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
            type: "active",
            refetchType: "active",
        });
    });

    it("does not churn active requests after a brief app switch", () => {
        const queryClient = {
            cancelQueries: vi.fn().mockResolvedValue(undefined),
            invalidateQueries: vi.fn().mockResolvedValue(undefined),
        };
        render(<AppResumeRecovery queryClient={queryClient} />);

        visibilityState = "hidden";
        fireEvent(document, new Event("visibilitychange"));
        vi.advanceTimersByTime(1_000);
        visibilityState = "visible";
        fireEvent(document, new Event("visibilitychange"));

        expect(queryClient.cancelQueries).not.toHaveBeenCalled();
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
});
