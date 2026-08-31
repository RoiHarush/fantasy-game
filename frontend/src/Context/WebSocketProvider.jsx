"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import { useAuth } from "./AuthContext";
import { WebSocketContext } from "./WebSocketContext";
import { getClientInstanceId } from "../features/notifications/clientInstance";
import { apiRequest } from "../services/apiClient";

const RESUME_RECONNECT_AFTER_MS = 10_000;
const TICKET_RETRY_DELAY_MS = 5_000;
const WEB_SOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "http://localhost:8080/ws";

export function WebSocketProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id;

    const [connected, setConnected] = useState(false);

    const stompClientRef = useRef(null);

    // Topics that components currently want to receive.
    // topic -> Set<callback>
    const desiredSubscriptionsRef = useRef(new Map());

    // Subscriptions that are active on the current STOMP connection.
    // topic -> StompSubscription
    const activeSubscriptionsRef = useRef(new Map());

    const activateSubscription = useCallback((topic) => {
        const client = stompClientRef.current;
        const callbacks = desiredSubscriptionsRef.current.get(topic);

        if (!client?.connected || !callbacks?.size) {
            return;
        }

        if (activeSubscriptionsRef.current.has(topic)) {
            return;
        }

        const subscription = client.subscribe(topic, (message) => {
            try {
                const parsedBody = message.body
                    ? JSON.parse(message.body)
                    : null;

                const latestCallbacks = desiredSubscriptionsRef.current.get(topic);
                for (const latestCallback of latestCallbacks ?? []) {
                    try {
                        latestCallback(parsedBody);
                    } catch (callbackError) {
                        console.error(`WebSocket callback failed for ${topic}:`, callbackError);
                    }
                }
            } catch (error) {
                console.error(
                    `Failed to parse WebSocket message from ${topic}:`,
                    error,
                    message.body
                );
            }
        });

        activeSubscriptionsRef.current.set(topic, subscription);
    }, []);

    const unsubscribe = useCallback((topicOrCleanup) => {
        // Supports callers that pass the cleanup function returned by subscribe.
        if (typeof topicOrCleanup === "function") {
            topicOrCleanup();
            return;
        }

        const topic = topicOrCleanup;

        if (!topic) {
            return;
        }

        desiredSubscriptionsRef.current.delete(topic);

        const activeSubscription =
            activeSubscriptionsRef.current.get(topic);

        if (activeSubscription) {
            try {
                activeSubscription.unsubscribe();
            } catch (error) {
                console.error(
                    `Failed to unsubscribe from ${topic}:`,
                    error
                );
            }

            activeSubscriptionsRef.current.delete(topic);
        }
    }, []);

    const subscribe = useCallback(
        (topic, callback) => {
            if (!topic || typeof callback !== "function") {
                console.error(
                    "WebSocket subscribe requires a topic and callback"
                );

                return () => { };
            }

            let callbacks = desiredSubscriptionsRef.current.get(topic);
            if (!callbacks) {
                callbacks = new Set();
                desiredSubscriptionsRef.current.set(topic, callbacks);
            }
            callbacks.add(callback);

            // If already connected, subscribe immediately.
            activateSubscription(topic);

            return () => {
                const currentCallbacks = desiredSubscriptionsRef.current.get(topic);
                currentCallbacks?.delete(callback);

                if (!currentCallbacks?.size) {
                    desiredSubscriptionsRef.current.delete(topic);
                    const activeSubscription = activeSubscriptionsRef.current.get(topic);
                    if (activeSubscription) {
                        try {
                            activeSubscription.unsubscribe();
                        } catch (error) {
                            console.error(`Failed to unsubscribe from ${topic}:`, error);
                        }
                        activeSubscriptionsRef.current.delete(topic);
                    }
                }
            };
        },
        [activateSubscription]
    );

    const sendMessage = useCallback((destination, body) => {
        const client = stompClientRef.current;

        if (!client?.connected) {
            console.warn(
                `Cannot send WebSocket message to ${destination}: not connected`
            );

            return false;
        }

        try {
            client.publish({
                destination,
                body:
                    typeof body === "string"
                        ? body
                        : JSON.stringify(body ?? {}),
            });

            return true;
        } catch (error) {
            console.error(
                `Failed to send WebSocket message to ${destination}:`,
                error
            );

            return false;
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            return undefined;
        }

        /*
         * Keep a stable reference for this effect and its cleanup.
         * This also satisfies the React Hooks lint rule.
         */
        const activeSubscriptions = activeSubscriptionsRef.current;

        let disposed = false;
        let hiddenAt = document.visibilityState === "hidden" ? Date.now() : null;
        let resumeReconnectPromise = null;
        let lastResumeReconnectAt = 0;
        let ticketFailureLogged = false;
        const ticketRequestController = new AbortController();

        const waitForTicketRetry = () => new Promise((resolve) => {
            if (ticketRequestController.signal.aborted) {
                resolve();
                return;
            }

            const timeoutId = window.setTimeout(resolve, TICKET_RETRY_DELAY_MS);
            ticketRequestController.signal.addEventListener("abort", () => {
                window.clearTimeout(timeoutId);
                resolve();
            }, { once: true });
        });

        const publishPresence = (stompClient, visible = document.visibilityState === "visible") => {
            if (!stompClient?.connected) return;
            stompClient.publish({
                destination: "/app/presence",
                body: JSON.stringify({
                    visible,
                    clientInstanceId: getClientInstanceId(),
                    page: window.location.pathname,
                }),
            });
        };

        let presenceInterval = null;
        const reportPresenceNow = () => publishPresence(stompClientRef.current);
        const reportPageHidden = () => {
            hiddenAt = Date.now();
            publishPresence(stompClientRef.current, false);
        };

        const client = new Client({
            /*
             * WebSocket upgrades connect directly to Spring. Ordinary REST
             * requests continue through the same-origin Next.js `/api` rewrite.
             */
            webSocketFactory: () => new SockJS(WEB_SOCKET_URL),

            // The browser never receives the long-lived HttpOnly session JWT.
            // Before every initial connection or reconnect it exchanges that
            // session for a dedicated 30-second WebSocket-only ticket.
            beforeConnect: async (stompClient) => {
                while (!disposed
                    && !ticketRequestController.signal.aborted
                    && stompClient.active) {
                    try {
                        const response = await apiRequest("/api/auth/websocket-ticket", {
                            method: "POST",
                            body: {},
                            signal: ticketRequestController.signal,
                            timeoutMs: 10_000,
                        });
                        if (!response?.ticket) {
                            throw new Error("The server returned an empty WebSocket ticket");
                        }

                        stompClient.connectHeaders = {
                            Authorization: `Bearer ${response.ticket}`,
                        };
                        ticketFailureLogged = false;
                        return;
                    } catch (error) {
                        if (disposed || ticketRequestController.signal.aborted || !stompClient.active) {
                            return;
                        }
                        if (!ticketFailureLogged) {
                            console.warn("Unable to obtain a WebSocket ticket; retrying.", error);
                            ticketFailureLogged = true;
                        }
                        await waitForTicketRetry();
                    }
                }
            },

            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectionTimeout: 10000,

            // Disable verbose STOMP console output.
            debug: () => { },
        });

        const reconnectAfterResume = () => {
            if (disposed || resumeReconnectPromise || !client.active || client.connected) return;

            const now = Date.now();
            if (now - lastResumeReconnectAt < 2_000) return;
            lastResumeReconnectAt = now;
            activeSubscriptions.clear();
            setConnected(false);

            // Rebuild only a connection that STOMP has already identified as
            // disconnected. Healthy sockets keep their session and presence;
            // heartbeat monitoring still closes a genuinely frozen transport
            // and lets the configured reconnect loop recover it.
            resumeReconnectPromise = client.deactivate({ force: true })
                .then(() => {
                    if (!disposed) client.activate();
                })
                .catch((error) => {
                    console.error("Failed to recover WebSocket after app resume:", error);
                })
                .finally(() => {
                    resumeReconnectPromise = null;
                });
        };

        const recoverAfterResume = () => {
            if (document.visibilityState !== "visible") return;

            const backgroundDuration = hiddenAt == null ? 0 : Date.now() - hiddenAt;
            hiddenAt = null;
            reportPresenceNow();

            if (backgroundDuration >= RESUME_RECONNECT_AFTER_MS) {
                reconnectAfterResume();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") reportPageHidden();
            else recoverAfterResume();
        };

        client.onConnect = () => {
            if (disposed) {
                return;
            }

            if (process.env.NODE_ENV === "development") {
                console.info("WebSocket connected");
            }
            setConnected(true);

            /*
             * A reconnect creates a new STOMP session.
             * Previous subscription objects are no longer valid.
             */
            activeSubscriptions.clear();

            /*
             * Recreate every subscription requested by the application.
             */
            for (const topic of desiredSubscriptionsRef.current.keys()) {
                activateSubscription(topic);
            }

            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pageshow", recoverAfterResume);
            window.removeEventListener("focus", recoverAfterResume);
            window.removeEventListener("pagehide", reportPageHidden);
            if (presenceInterval) window.clearInterval(presenceInterval);
            publishPresence(client);
            document.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("pageshow", recoverAfterResume);
            window.addEventListener("focus", recoverAfterResume);
            window.addEventListener("pagehide", reportPageHidden);
            presenceInterval = window.setInterval(reportPresenceNow, 10_000);
        };

        client.onStompError = (frame) => {
            console.error(
                "STOMP broker error:",
                frame.headers?.message ?? "Unknown STOMP error",
                frame.body
            );

            activeSubscriptions.clear();

            if (!disposed) {
                setConnected(false);
            }
        };

        client.onWebSocketError = (event) => {
            console.error("WebSocket transport error:", event);

            if (!disposed) {
                setConnected(false);
            }
        };

        client.onWebSocketClose = () => {
            /*
             * The client will try reconnecting because reconnectDelay
             * is configured.
             */
            activeSubscriptions.clear();

            if (!disposed) {
                setConnected(false);
            }
        };

        stompClientRef.current = client;
        client.activate();

        return () => {
            disposed = true;
            setConnected(false);
            ticketRequestController.abort();

            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pageshow", recoverAfterResume);
            window.removeEventListener("focus", recoverAfterResume);
            window.removeEventListener("pagehide", reportPageHidden);
            if (presenceInterval) window.clearInterval(presenceInterval);

            activeSubscriptions.clear();

            if (stompClientRef.current === client) {
                stompClientRef.current = null;
            }

            if (client.connected) {
                client.publish({
                    destination: "/app/presence/disconnect",
                    body: "{}",
                });
            }
            void client.deactivate().then(() => {
                if (process.env.NODE_ENV === "development") {
                    console.info("WebSocket disconnected");
                }
            });
        };
    }, [userId, activateSubscription]);

    return (
        <WebSocketContext.Provider
            value={{
                connected: Boolean(userId && connected),
                subscribe,
                unsubscribe,
                sendMessage,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}
