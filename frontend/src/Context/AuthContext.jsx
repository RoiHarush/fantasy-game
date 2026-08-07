"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import {
    apiRequest,
    ApiError,
    clearSession,
    getStoredToken,
    saveSession,
} from "../services/apiClient";
import { getPostLoginRoute } from "../Utils/routing";

const AuthContext = createContext(null);
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionMessage, setSessionMessage] = useState("");
    const router = useRouter();

    const applyUser = useCallback((nextUser, nextToken = null) => {
        const sessionToken = nextToken || getStoredToken();
        if (sessionToken) {
            saveSession(sessionToken, nextUser);
        }
        setToken(sessionToken);
        setUser(nextUser);
    }, []);

    const refreshCurrentUser = useCallback(async () => {
        const currentUser = await apiRequest("/api/auth/me");
        const storedToken = getStoredToken();
        saveSession(storedToken, currentUser);
        setToken(storedToken);
        setUser(currentUser);
        return currentUser;
    }, []);

    const resetSession = useCallback(() => {
        clearSession();
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const bootstrapSession = async () => {
            const token = getStoredToken();

            if (!token) {
                if (!cancelled) {
                    resetSession();
                    setLoading(false);
                }
                return;
            }

            try {
                const currentUser = await apiRequest("/api/auth/me");
                if (cancelled) return;

                applyUser(currentUser, token);
                setSessionMessage("");
            } catch (error) {
                if (cancelled) return;

                if (error instanceof ApiError && error.status === 401) {
                    resetSession();
                } else {
                    setToken(token);
                    setUser(null);
                }
                setSessionMessage(error?.message || SESSION_EXPIRED_MESSAGE);
                router.replace("/login");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        bootstrapSession();

        return () => {
            cancelled = true;
        };
    }, [applyUser, resetSession, router]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const handleStorageChange = (event) => {
            if (event.key !== "token" && event.key !== "loggedUser" && event.key !== null) {
                return;
            }

            const token = getStoredToken();
            if (!token) {
                resetSession();
                setSessionMessage(SESSION_EXPIRED_MESSAGE);
                router.replace("/login");
                return;
            }

            setToken(token);
        };

        const handleSessionExpired = (event) => {
            resetSession();
            setSessionMessage(event.detail?.message || SESSION_EXPIRED_MESSAGE);
            router.replace("/login");
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("fantasy-auth-session-expired", handleSessionExpired);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("fantasy-auth-session-expired", handleSessionExpired);
        };
    }, [resetSession, router]);

    const login = useCallback((userOrPayload, maybeToken) => {
        const resolvedUser = userOrPayload?.user ?? userOrPayload;
        const resolvedToken = userOrPayload?.token ?? maybeToken;

        if (resolvedToken && resolvedUser) {
            saveSession(resolvedToken, resolvedUser);
        }

        setToken(resolvedToken || null);
        setUser(resolvedUser || null);
        setSessionMessage("");
        router.replace(getPostLoginRoute(resolvedUser));
    }, [router]);

    const logout = useCallback((options = {}) => {
        const { redirect = true, message = "" } = options;
        resetSession();
        setSessionMessage(message);
        if (redirect) {
            router.replace('/login');
        }
    }, [resetSession, router]);

    const updateUser = useCallback((updates) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;
            const updatedUser = { ...currentUser, ...updates };
            saveSession(getStoredToken(), updatedUser);
            return updatedUser;
        });
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            updateUser,
            refreshCurrentUser,
            sessionMessage,
            clearSessionMessage: () => setSessionMessage(""),
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
