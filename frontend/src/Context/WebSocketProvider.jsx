"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import { useAuth } from "./AuthContext";
import { WebSocketContext } from "./WebSocketContext";
import { getClientInstanceId } from "../features/notifications/clientInstance";

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

        const publishPresence = (stompClient) => {
            if (!stompClient?.connected) return;
            stompClient.publish({
                destination: "/app/presence",
                body: JSON.stringify({
                    visible: document.visibilityState === "visible",
                    clientInstanceId: getClientInstanceId(),
                    page: window.location.pathname,
                }),
            });
        };

        let presenceInterval = null;
        const reportPresenceNow = () => publishPresence(stompClientRef.current);

        const client = new Client({
            /*
             * Next.js should rewrite `/ws` to the Spring Boot backend.
             */
            webSocketFactory: () => new SockJS("/ws"),

            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectionTimeout: 10000,

            // Disable verbose STOMP console output.
            debug: () => { },
        });

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

            document.removeEventListener("visibilitychange", reportPresenceNow);
            window.removeEventListener("pageshow", reportPresenceNow);
            window.removeEventListener("pagehide", reportPresenceNow);
            if (presenceInterval) window.clearInterval(presenceInterval);
            publishPresence(client);
            document.addEventListener("visibilitychange", reportPresenceNow);
            window.addEventListener("pageshow", reportPresenceNow);
            window.addEventListener("pagehide", reportPresenceNow);
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

            document.removeEventListener("visibilitychange", reportPresenceNow);
            window.removeEventListener("pageshow", reportPresenceNow);
            window.removeEventListener("pagehide", reportPresenceNow);
            if (presenceInterval) window.clearInterval(presenceInterval);

            activeSubscriptions.clear();

            if (stompClientRef.current === client) {
                stompClientRef.current = null;
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
