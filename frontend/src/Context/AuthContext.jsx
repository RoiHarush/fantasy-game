"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { endSession, getCurrentUser } from "../features/auth/api";
import { getPostLoginRoute } from "../Utils/routing";
import { disablePushForCurrentDevice } from "../features/notifications/api";

const AuthContext = createContext(null);
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

export const AuthProvider = ({ children, initialUser = null, invalidSession = false }) => {
    const [user, setUser] = useState(initialUser);
    const [sessionMessage, setSessionMessage] = useState("");
    const router = useRouter();
    const queryClient = useQueryClient();
    const invalidSessionCleanupStarted = useRef(false);
    const userRef = useRef(initialUser);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const refreshCurrentUser = useCallback(async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        return currentUser;
    }, []);

    const resetSession = useCallback(() => {
        setUser(null);
        queryClient.clear();
    }, [queryClient]);

    useEffect(() => {
        // One-time cleanup from the pre-cookie authentication implementation.
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("loggedUser");
    }, []);

    useEffect(() => {
        if (!invalidSession || invalidSessionCleanupStarted.current) return;

        invalidSessionCleanupStarted.current = true;
        endSession()
            .catch((error) => {
                console.warn("Unable to clear the expired server session.", error);
            })
            .finally(() => {
                resetSession();
                setSessionMessage(SESSION_EXPIRED_MESSAGE);
                router.refresh();
            });
    }, [invalidSession, resetSession, router]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const handleSessionExpired = (event) => {
            resetSession();
            setSessionMessage(event.detail?.message || SESSION_EXPIRED_MESSAGE);
            router.replace("/login");
            router.refresh();
        };

        window.addEventListener("fantasy-auth-session-expired", handleSessionExpired);

        return () => {
            window.removeEventListener("fantasy-auth-session-expired", handleSessionExpired);
        };
    }, [resetSession, router]);

    const login = useCallback((userOrPayload) => {
        const resolvedUser = userOrPayload?.user ?? userOrPayload;
        setUser(resolvedUser || null);
        setSessionMessage("");
        router.replace(getPostLoginRoute(resolvedUser));
        router.refresh();
    }, [router]);

    const logout = useCallback(async (options = {}) => {
        const { redirect = true, message = "" } = options;
        try {
            await disablePushForCurrentDevice().catch((error) => {
                console.warn("Unable to remove this device's push subscription.", error);
            });
            await endSession();
        } catch (error) {
            console.warn("The server logout request failed; clearing the local UI session.", error);
        } finally {
            resetSession();
            setSessionMessage(message);
            if (redirect) {
                router.replace('/login');
                router.refresh();
            }
        }
    }, [resetSession, router]);

    const prepareForAccountSwitch = useCallback(async () => {
        const hadAuthenticatedUser = Boolean(userRef.current);

        // Clear the local identity first. WebSocketProvider observes this change
        // and immediately tears down subscriptions belonging to the old user.
        userRef.current = null;
        resetSession();
        setSessionMessage("");

        try {
            if (hadAuthenticatedUser) {
                await disablePushForCurrentDevice().catch((error) => {
                    console.warn("Unable to remove the previous account's push subscription.", error);
                });
            }
            await endSession();
        } catch (error) {
            console.warn("Unable to clear the previous server session before switching accounts.", error);
        }
    }, [resetSession]);

    const updateUser = useCallback((updates) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;
            return { ...currentUser, ...updates };
        });
    }, []);

    const clearSessionMessage = useCallback(() => {
        setSessionMessage("");
    }, []);

    const value = useMemo(() => ({
        user,
        login,
        logout,
        prepareForAccountSwitch,
        updateUser,
        refreshCurrentUser,
        sessionMessage,
        clearSessionMessage,
    }), [
        clearSessionMessage,
        login,
        logout,
        prepareForAccountSwitch,
        refreshCurrentUser,
        sessionMessage,
        updateUser,
        user,
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
};
