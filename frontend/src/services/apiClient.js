const SESSION_EXPIRED_EVENT = "fantasy-auth-session-expired";

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

function getStorage() {
    if (!isBrowser()) return null;
    return window.localStorage;
}

export function getStoredToken() {
    return getStorage()?.getItem("token") ?? null;
}

export function getStoredUser() {
    const rawUser = getStorage()?.getItem("loggedUser");
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch {
        return null;
    }
}

export function saveSession(token, user) {
    const storage = getStorage();
    if (!storage) return;

    if (token) {
        storage.setItem("token", token);
    }
    if (user) {
        storage.setItem("loggedUser", JSON.stringify(user));
    }
}

export function clearSession() {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem("token");
    storage.removeItem("loggedUser");
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
    } = options;

    const requestHeaders = new Headers(headers || {});
    let requestBody = body;

    if (auth) {
        const token = getStoredToken();
        if (token) {
            requestHeaders.set("Authorization", `Bearer ${token}`);
        }
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

    const response = await fetch(path, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal,
        credentials: "same-origin",
    });

    const { body: responseBody, contentType } = await readResponseBody(response);

    if (!response.ok) {
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
}

export function isApiError(error) {
    return error instanceof ApiError;
}
