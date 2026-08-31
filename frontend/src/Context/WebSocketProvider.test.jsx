import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    apiRequest: vi.fn(),
    clients: [],
    sockJs: vi.fn(function MockSockJs(url) {
        this.url = url;
    }),
}));

vi.mock("./AuthContext", () => ({
    useAuth: () => ({ user: { id: 7 } }),
}));

vi.mock("../services/apiClient", () => ({
    apiRequest: mocks.apiRequest,
}));

vi.mock("sockjs-client", () => ({
    default: mocks.sockJs,
}));

vi.mock("@stomp/stompjs", () => ({
    Client: class MockStompClient {
        constructor(configuration) {
            Object.assign(this, configuration);
            this.active = false;
            this.connected = false;
            this.connectHeaders = {};
            this.activate = vi.fn(() => {
                this.active = true;
                this.activationPromise = this.beforeConnect(this);
            });
            this.deactivate = vi.fn(() => {
                this.active = false;
                this.connected = false;
                return Promise.resolve();
            });
            this.publish = vi.fn();
            mocks.clients.push(this);
        }
    },
}));

import { WebSocketProvider } from "./WebSocketProvider";

describe("WebSocketProvider authentication", () => {
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        mocks.apiRequest.mockReset();
        mocks.sockJs.mockClear();
        mocks.clients.length = 0;
    });

    it("obtains a fresh ticket before direct initial and reconnect attempts", async () => {
        mocks.apiRequest
            .mockResolvedValueOnce({ ticket: "initial-ticket", expiresInMillis: 30_000 })
            .mockResolvedValueOnce({ ticket: "reconnect-ticket", expiresInMillis: 30_000 });

        const view = render(
            <WebSocketProvider>
                <div>Connected application</div>
            </WebSocketProvider>
        );

        await waitFor(() => expect(mocks.apiRequest).toHaveBeenCalledTimes(1));
        const client = mocks.clients[0];
        await act(async () => client.activationPromise);

        expect(mocks.apiRequest).toHaveBeenLastCalledWith(
            "/api/auth/websocket-ticket",
            expect.objectContaining({ method: "POST", body: {} })
        );
        expect(client.connectHeaders).toEqual({
            Authorization: "Bearer initial-ticket",
        });

        client.webSocketFactory();
        expect(mocks.sockJs).toHaveBeenCalledWith("http://localhost:8080/ws");

        await act(async () => client.beforeConnect(client));
        expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
        expect(client.connectHeaders).toEqual({
            Authorization: "Bearer reconnect-ticket",
        });

        view.unmount();
    });

    it("keeps a healthy socket connected after returning from the background", async () => {
        let visibilityState = "visible";
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: () => visibilityState,
        });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-31T08:00:00Z"));
        mocks.apiRequest.mockResolvedValue({ ticket: "healthy-ticket" });

        render(
            <WebSocketProvider>
                <div>Connected application</div>
            </WebSocketProvider>
        );

        const client = mocks.clients[0];
        await act(async () => client.activationPromise);
        client.connected = true;
        act(() => client.onConnect());
        client.deactivate.mockClear();

        visibilityState = "hidden";
        fireEvent(document, new Event("visibilitychange"));
        vi.advanceTimersByTime(11_000);
        visibilityState = "visible";
        fireEvent(document, new Event("visibilitychange"));

        expect(client.deactivate).not.toHaveBeenCalled();
        expect(client.publish).toHaveBeenCalledWith(expect.objectContaining({
            destination: "/app/presence",
        }));
    });

    it("rebuilds a socket that is disconnected while the app is in the background", async () => {
        let visibilityState = "visible";
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: () => visibilityState,
        });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-31T08:00:00Z"));
        mocks.apiRequest.mockResolvedValue({ ticket: "recovery-ticket" });

        render(
            <WebSocketProvider>
                <div>Connected application</div>
            </WebSocketProvider>
        );

        const client = mocks.clients[0];
        await act(async () => client.activationPromise);
        client.connected = true;
        act(() => client.onConnect());
        client.deactivate.mockClear();

        visibilityState = "hidden";
        fireEvent(document, new Event("visibilitychange"));
        vi.advanceTimersByTime(11_000);
        client.connected = false;
        visibilityState = "visible";
        await act(async () => {
            fireEvent(document, new Event("visibilitychange"));
            await Promise.resolve();
        });

        expect(client.deactivate).toHaveBeenCalledWith({ force: true });
        expect(client.activate).toHaveBeenCalledTimes(2);
    });
});
