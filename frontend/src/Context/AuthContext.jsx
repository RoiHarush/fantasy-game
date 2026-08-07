"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useQueryClient } from "@tanstack/react-query";
import {
    apiRequest,
} from "../services/apiClient";
import { getPostLoginRoute } from "../Utils/routing";

const AuthContext = createContext(null);
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

export const AuthProvider = ({ children, initialUser = null }) => {
    const [user, setUser] = useState(initialUser);
    const [sessionMessage, setSessionMessage] = useState("");
    const router = useRouter();
    const queryClient = useQueryClient();

    const refreshCurrentUser = useCallback(async () => {
        const currentUser = await apiRequest("/api/auth/me");
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
            await apiRequest("/api/auth/logout", { method: "POST", auth: false });
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

    const updateUser = useCallback((updates) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;
            return { ...currentUser, ...updates };
        });
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            loading: false,
            login,
            logout,
            updateUser,
            refreshCurrentUser,
            sessionMessage,
            clearSessionMessage: () => setSessionMessage(""),
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
