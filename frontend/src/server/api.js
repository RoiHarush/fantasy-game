import "server-only";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "fantasy_session";
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

    if (sessionCookie?.value) {
        headers.set("Cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie.value)}`);
    }

    const response = await fetch(`${backendUrl}${path}`, {
        ...options,
        headers,
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
}
