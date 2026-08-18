import { act, render, waitFor } from "@testing-library/react";
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
            mocks.clients.push(this);
        }

        activate() {
            this.active = true;
            this.activationPromise = this.beforeConnect(this);
        }

        deactivate() {
            this.active = false;
            return Promise.resolve();
        }

        publish() { }
    },
}));

import { WebSocketProvider } from "./WebSocketProvider";

describe("WebSocketProvider authentication", () => {
    afterEach(() => {
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
});
