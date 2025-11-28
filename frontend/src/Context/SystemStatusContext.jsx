import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useWebSocket } from "./WebSocketContext";
import { fetchSystemStatus } from "../services/systemService";

const SystemStatusContext = createContext();

const MIN_DISPLAY_TIME = 2 * 60 * 1000;
const STORAGE_KEY = 'gw_update_start_time';

export function SystemStatusProvider({ children }) {
    const [isSystemLocked, setIsSystemLocked] = useState(false);
    const lockStartTimeRef = useRef(null);
    const { subscribe, unsubscribe, connected } = useWebSocket();

    const wipeStorage = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const clearLock = useCallback(() => {
        setIsSystemLocked(false);
        lockStartTimeRef.current = null;
        wipeStorage();
        console.log("🔓 System fully unlocked.");
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
            console.log(`⏳ Global timer: unlocking in ${(remaining / 1000).toFixed(0)}s`);
            setTimeout(() => {
                clearLock();
            }, remaining);
        } else {
            clearLock();
        }
    }, [clearLock]);

    useEffect(() => {
        const initializeStatus = async () => {
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

            try {
                const isBackendLocked = await fetchSystemStatus();
                if (isBackendLocked) {
                    handleLock();
                } else {
                    if (localStorage.getItem(STORAGE_KEY)) {
                        handleUnlock();
                    }
                }
            } catch (e) {
                console.error("Failed to check system status:", e);
            }
        };

        initializeStatus();
    }, [handleLock, handleUnlock, wipeStorage]);

    useEffect(() => {
        if (!connected) return;

        const sub = subscribe('/topic/system-status', (data) => {
            console.log("📡 WS Event in Context:", data);
            if (data?.status === 'LOCKED') handleLock();
            else if (data?.status === 'UNLOCKED') handleUnlock();
        });

        return () => unsubscribe(sub);
    }, [connected, subscribe, unsubscribe, handleLock, handleUnlock]);

    return (
        <SystemStatusContext.Provider value={{ isSystemLocked }}>
            {children}
        </SystemStatusContext.Provider>
    );
}

export function useSystemStatus() {
    return useContext(SystemStatusContext);
}