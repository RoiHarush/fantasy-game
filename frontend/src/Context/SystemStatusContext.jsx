"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./WebSocketContext";
import { fetchSystemStatus } from "../services/systemService";
import { useAuth } from "./AuthContext";
import { queryKeys } from "../lib/query/keys";

const SystemStatusContext = createContext(null);

const MIN_DISPLAY_TIME = 2 * 60 * 1000;
const STORAGE_KEY = 'gw_update_start_time';

export function SystemStatusProvider({ children }) {
    const [isSystemLocked, setIsSystemLocked] = useState(false);
    const lockStartTimeRef = useRef(null);
    const unlockTimerRef = useRef(null);
    const { subscribe, connected } = useWebSocket();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const statusQuery = useQuery({
        queryKey: queryKeys.systemStatus,
        queryFn: fetchSystemStatus,
        enabled: Boolean(user?.id),
        staleTime: 5_000,
        refetchInterval: connected ? false : 15_000,
    });

    const wipeStorage = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const clearLock = useCallback(() => {
        if (unlockTimerRef.current !== null) {
            window.clearTimeout(unlockTimerRef.current);
            unlockTimerRef.current = null;
        }
        setIsSystemLocked(false);
        lockStartTimeRef.current = null;
        wipeStorage();
    }, [wipeStorage]);

    const handleLock = useCallback(() => {
        setIsSystemLocked(true);

        if (lockStartTimeRef.current === null) {
            const storedTime = localStorage.getItem(STORAGE_KEY);

            if (storedTime) {
                lockStartTimeRef.current = parseInt(storedTime, 10);
            } else {
                const now = Date.now();
                lockStartTimeRef.current = now;
                localStorage.setItem(STORAGE_KEY, now.toString());
            }
        }
    }, []);

    const handleUnlock = useCallback(() => {
        const now = Date.now();

        if (lockStartTimeRef.current === null) {
            const storedTime = localStorage.getItem(STORAGE_KEY);
            if (storedTime) {
                lockStartTimeRef.current = parseInt(storedTime, 10);
            } else {
                lockStartTimeRef.current = now;
                localStorage.setItem(STORAGE_KEY, now.toString());
            }
        }

        const timePassed = now - lockStartTimeRef.current;
        const remaining = MIN_DISPLAY_TIME - timePassed;

        if (remaining > 0) {
            if (unlockTimerRef.current !== null) {
                window.clearTimeout(unlockTimerRef.current);
            }
            unlockTimerRef.current = window.setTimeout(() => {
                unlockTimerRef.current = null;
                clearLock();
            }, remaining);
        } else {
            clearLock();
        }
    }, [clearLock]);

    useEffect(() => () => {
        if (unlockTimerRef.current !== null) {
            window.clearTimeout(unlockTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if (!user?.id || statusQuery.data === undefined) return;

        const reconcileStatus = () => {
            const storedTime = localStorage.getItem(STORAGE_KEY);

            if (storedTime) {
                const startTime = parseInt(storedTime, 10);
                const now = Date.now();
                const remaining = MIN_DISPLAY_TIME - (now - startTime);

                if (remaining > 0) {
                    setIsSystemLocked(true);
                    lockStartTimeRef.current = startTime;
                } else {
                    wipeStorage();
                }
            }

            if (statusQuery.data) {
                handleLock();
            } else if (localStorage.getItem(STORAGE_KEY)) {
                handleUnlock();
            }
        };

        reconcileStatus();
    }, [handleLock, handleUnlock, statusQuery.data, user?.id, wipeStorage]);

    useEffect(() => {
        if (!connected) return;

        return subscribe('/topic/system-status', (data) => {
            if (data?.status === 'LOCKED') {
                queryClient.setQueryData(queryKeys.systemStatus, true);
                handleLock();
            } else if (data?.status === 'UNLOCKED') {
                queryClient.setQueryData(queryKeys.systemStatus, false);
                handleUnlock();
            }
        });

    }, [connected, subscribe, handleLock, handleUnlock, queryClient]);

    return (
        <SystemStatusContext.Provider value={{ isSystemLocked: Boolean(user?.id && isSystemLocked) }}>
            {children}
        </SystemStatusContext.Provider>
    );
}

export function useSystemStatus() {
    const context = useContext(SystemStatusContext);
    if (!context) {
        throw new Error("useSystemStatus must be used inside SystemStatusProvider");
    }
    return context;
}
