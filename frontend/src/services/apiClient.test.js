import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "./apiClient";

function jsonResponse(body, init = {}) {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
        ...init,
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/";
});

describe("apiRequest", () => {
    it("accepts only same-origin relative API paths", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        await expect(apiRequest("https://example.com/api/users")).rejects.toThrow(
            "API paths must be relative",
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("reads JSON responses with same-origin credentials", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 7 }));
        vi.stubGlobal("fetch", fetchMock);

        await expect(apiRequest("/api/users/7")).resolves.toEqual({ id: 7 });
        expect(fetchMock).toHaveBeenCalledWith("/api/users/7", expect.objectContaining({
            credentials: "same-origin",
            method: "GET",
        }));
    });

    it("serializes JSON mutations and sends the CSRF token", async () => {
        document.cookie = "XSRF-TOKEN=csrf-token; Path=/";
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ saved: true }));
        vi.stubGlobal("fetch", fetchMock);

        await apiRequest("/api/settings", {
            method: "PUT",
            body: { name: "Manager" },
        });

        const [, request] = fetchMock.mock.calls[0];
        expect(request.body).toBe(JSON.stringify({ name: "Manager" }));
        expect(request.headers.get("Content-Type")).toBe("application/json");
        expect(request.headers.get("X-XSRF-TOKEN")).toBe("csrf-token");
    });

    it("emits a session-expired event for authenticated 401 responses", async () => {
        const sessionExpired = vi.fn();
        window.addEventListener("fantasy-auth-session-expired", sessionExpired, { once: true });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(
            { message: "Session expired" },
            { status: 401 },
        )));

        await expect(apiRequest("/api/protected")).rejects.toBeInstanceOf(ApiError);
        expect(sessionExpired).toHaveBeenCalledOnce();
    });
});
