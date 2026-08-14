"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../Context/AuthContext";
import { useWebSocket } from "../../Context/WebSocketContext";
import { disablePushForCurrentDevice, enablePushForCurrentDevice, getCurrentPushState, syncExistingPushSubscription } from "./api";
import { showNotificationToast } from "./showNotificationToast";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const { subscribe } = useWebSocket();
    const [pushState, setPushState] = useState("loading");
    const [busy, setBusy] = useState(false);
    const seenEvents = useRef(new Set());

    const refresh = useCallback(async () => {
        const state = await getCurrentPushState();
        setPushState(state);
        return state;
    }, []);

    useEffect(() => {
        let active = true;
        getCurrentPushState()
            .then((state) => {
                if (active) setPushState(state);
                if (state === "enabled" && user?.id) return syncExistingPushSubscription();
                return null;
            })
            .catch(() => {
                if (active) setPushState("disabled");
            });
        return () => {
            active = false;
        };
    }, [user?.id]);

    useEffect(() => subscribe("/user/queue/notifications", (event) => {
        // A hidden tab never displays the in-app channel. The service worker is
        // the only UI allowed to notify an inactive user.
        if (document.visibilityState !== "visible" || !event?.eventId) return;
        if (seenEvents.current.has(event.eventId)) return;
        seenEvents.current.add(event.eventId);
        if (seenEvents.current.size > 100) {
            seenEvents.current.delete(seenEvents.current.values().next().value);
        }
        showNotificationToast(event);
    }), [subscribe]);

    const enable = useCallback(async () => {
        setBusy(true);
        try {
            await enablePushForCurrentDevice();
            setPushState("enabled");
        } finally {
            setBusy(false);
        }
    }, []);

    const disable = useCallback(async () => {
        setBusy(true);
        try {
            await disablePushForCurrentDevice();
            setPushState("disabled");
        } finally {
            setBusy(false);
        }
    }, []);

    const value = useMemo(() => ({ pushState, busy, enable, disable, refresh }), [pushState, busy, enable, disable, refresh]);
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
    return context;
}
