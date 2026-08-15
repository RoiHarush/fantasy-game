export const API_RATE_LIMIT_EVENT = "fantasy-api-rate-limited";

export function emitApiRateLimited({ retryAfter } = {}) {
    if (typeof window === "undefined") return;

    const parsedRetryAfter = Number.parseInt(retryAfter, 10);
    window.dispatchEvent(new CustomEvent(API_RATE_LIMIT_EVENT, {
        detail: {
            retryAfterSeconds: Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : null,
        },
    }));
}
