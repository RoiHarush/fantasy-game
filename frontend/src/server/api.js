import "server-only";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "fantasy_session";
const DEFAULT_SERVER_REQUEST_TIMEOUT_MS = 20_000;
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ServerApiError extends Error {
    constructor(status, message, body = null) {
        super(message);
        this.name = "ServerApiError";
        this.status = status;
        this.body = body;
    }
}

export async function hasServerSession() {
    return (await cookies()).has(SESSION_COOKIE_NAME);
}

export async function serverApiRequest(path, options = {}) {
    if (!path.startsWith("/")) {
        throw new Error(`Server API paths must start with '/': ${path}`);
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const headers = new Headers(options.headers);
    const controller = new AbortController();
    const sourceSignal = options.signal;
    const abortFromSource = () => controller.abort(sourceSignal?.reason);
    const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
        ? options.timeoutMs
        : DEFAULT_SERVER_REQUEST_TIMEOUT_MS;

    if (sourceSignal?.aborted) abortFromSource();
    else sourceSignal?.addEventListener("abort", abortFromSource, { once: true });

    let timedOut = false;
    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    if (sessionCookie?.value) {
        headers.set("Cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie.value)}`);
    }

    try {
        const { timeoutMs: _timeoutMs, ...fetchOptions } = options;
        const response = await fetch(`${backendUrl}${path}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
            cache: options.cache ?? "no-store",
        });

        const contentType = response.headers.get("content-type") ?? "";
        const body = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof body === "string"
                ? body || `Request failed with HTTP ${response.status}`
                : body?.message || body?.error || `Request failed with HTTP ${response.status}`;
            throw new ServerApiError(response.status, message, body);
        }

        return body;
    } catch (error) {
        if (timedOut) {
            throw new ServerApiError(504, "The backend took too long to respond.", {
                code: "BACKEND_REQUEST_TIMEOUT",
            });
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
        sourceSignal?.removeEventListener("abort", abortFromSource);
    }
}
