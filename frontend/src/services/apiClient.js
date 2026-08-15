import { emitApiRateLimited } from "../lib/apiEvents";

const SESSION_EXPIRED_EVENT = "fantasy-auth-session-expired";
const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);
const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;
let csrfRequest = null;

export class ApiError extends Error {
    constructor({ status, message, body = null, contentType = "", url = "" }) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
        this.contentType = contentType;
        this.url = url;
    }
}

function isBrowser() {
    return typeof window !== "undefined";
}

async function withRequestTimeout(url, sourceSignal, timeoutMs, request) {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromSource = () => controller.abort(sourceSignal?.reason);

    if (sourceSignal?.aborted) {
        abortFromSource();
    } else {
        sourceSignal?.addEventListener("abort", abortFromSource, { once: true });
    }

    const normalizedTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : DEFAULT_REQUEST_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, normalizedTimeout);

    try {
        return await request(controller.signal);
    } catch (error) {
        if (timedOut) {
            throw new ApiError({
                status: 408,
                message: "The server took too long to respond. Please try again.",
                body: { code: "CLIENT_REQUEST_TIMEOUT" },
                url,
            });
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
        sourceSignal?.removeEventListener("abort", abortFromSource);
    }
}

function readCookie(name) {
    if (!isBrowser()) return null;

    const prefix = `${name}=`;
    const value = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))
        ?.slice(prefix.length);

    return value ? decodeURIComponent(value) : null;
}

async function getCsrfToken() {
    const existingToken = readCookie(CSRF_COOKIE_NAME);
    if (existingToken) return existingToken;

    if (!csrfRequest) {
        csrfRequest = withRequestTimeout(
            "/api/auth/csrf",
            null,
            DEFAULT_REQUEST_TIMEOUT_MS,
            async (signal) => {
                const response = await fetch("/api/auth/csrf", {
                    credentials: "same-origin",
                    cache: "no-store",
                    signal,
                });
                if (!response.ok) {
                    throw new Error(`Unable to initialize CSRF protection (HTTP ${response.status})`);
                }
                return response.json();
            },
        ).then((body) => readCookie(CSRF_COOKIE_NAME) ?? body?.token)
            .finally(() => {
                csrfRequest = null;
            });
    }

    return csrfRequest;
}

export function emitSessionExpired(message = "Your session expired. Please sign in again.") {
    if (!isBrowser()) return;

    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { message },
    }));
}

function isJsonContentType(contentType) {
    return contentType.includes("application/json") || contentType.includes("+json");
}

async function readResponseBody(response) {
    if (response.status === 204) {
        return { body: null, contentType: response.headers.get("content-type") || "" };
    }

    const contentType = response.headers.get("content-type") || "";

    if (isJsonContentType(contentType)) {
        const text = await response.text();
        if (!text.trim()) {
            return { body: null, contentType };
        }

        try {
            return { body: JSON.parse(text), contentType };
        } catch {
            return { body: text, contentType };
        }
    }

    const text = await response.text();
    return { body: text, contentType };
}

function buildMessage(response, body, contentType) {
    const status = response.status;

    if (contentType.includes("text/html") || (typeof body === "string" && body.trim().startsWith("<"))) {
        return `Request failed with HTTP ${status} and returned HTML instead of an API response.`;
    }

    if (typeof body === "string" && body.trim()) {
        return body.trim();
    }

    if (body && typeof body === "object") {
        const candidate = body.error || body.message || body.detail || body.title;
        if (candidate) return String(candidate);
    }

    switch (status) {
        case 401:
            return "Your session expired. Please sign in again.";
        case 403:
            return "You do not have permission to perform this action.";
        case 404:
            return "Requested resource was not found.";
        case 409:
            return "The request conflicts with the current server state.";
        case 422:
            return "The request could not be processed.";
        default:
            return `Request failed with HTTP ${status}.`;
    }
}

export async function apiRequest(path, options = {}) {
    if (!path.startsWith("/")) {
        throw new Error(`API paths must be relative and start with '/': ${path}`);
    }

    const {
        method = "GET",
        headers,
        body,
        auth = true,
        signal,
        timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    } = options;

    const requestHeaders = new Headers(headers || {});
    let requestBody = body;

    if (!SAFE_METHODS.has(method.toUpperCase()) && isBrowser()) {
        const csrfToken = await getCsrfToken();
        if (csrfToken) requestHeaders.set(CSRF_HEADER_NAME, csrfToken);
    }

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const isBinaryBody = typeof Blob !== "undefined" && body instanceof Blob
        || typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer
        || typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams
        || typeof ReadableStream !== "undefined" && body instanceof ReadableStream;

    if (body != null && !isFormData && !isBinaryBody) {
        if (typeof body === "object" && !(body instanceof String)) {
            requestHeaders.set("Content-Type", requestHeaders.get("Content-Type") || "application/json");
            requestBody = JSON.stringify(body);
        }
    }

    return withRequestTimeout(path, signal, timeoutMs, async (requestSignal) => {
        const response = await fetch(path, {
            method,
            headers: requestHeaders,
            body: requestBody,
            signal: requestSignal,
            credentials: "same-origin",
        });

        const { body: responseBody, contentType } = await readResponseBody(response);

        if (!response.ok) {
            if (response.status === 429) {
                emitApiRateLimited({ retryAfter: response.headers.get("Retry-After") });
            }

            if (response.status === 401 && auth) {
                emitSessionExpired();
            }

            throw new ApiError({
                status: response.status,
                message: buildMessage(response, responseBody, contentType),
                body: responseBody,
                contentType,
                url: path,
            });
        }

        return responseBody;
    });
}

export function isApiError(error) {
    return error instanceof ApiError;
}
