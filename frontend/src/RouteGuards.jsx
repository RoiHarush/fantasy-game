"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "./Components/General/LoadingPage";
import { useAuth } from "./Context/AuthContext";

export function RequireLeague({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (loading) {
            setAuthorized(false);
            return;
        }

        if (!user) {
            setAuthorized(false);
            router.replace("/login");
            return;
        }

        if (!user.leagueId) {
            setAuthorized(false);
            router.replace("/onboarding");
            return;
        }

        setAuthorized(true);
    }, [loading, router, user]);

    if (loading || !authorized) {
        return <LoadingPage />;
    }

    return children;
}

export function RequireActiveLeague({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (loading) {
            setAuthorized(false);
            return;
        }

        if (!user) {
            setAuthorized(false);
            router.replace("/login");
            return;
        }

        if (user.leagueStatus !== "ACTIVE") {
            setAuthorized(false);
            router.replace("/status");
            return;
        }

        setAuthorized(true);
    }, [loading, router, user]);

    if (loading || !authorized) {
        return <LoadingPage />;
    }

    return children;
}

export function RequireLeagueAdmin({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (loading) {
            setAuthorized(false);
            return;
        }

        if (!user) {
            setAuthorized(false);
            router.replace("/login");
            return;
        }

        if (!user.leagueAdmin) {
            setAuthorized(false);
            router.replace("/status");
            return;
        }

        setAuthorized(true);
    }, [loading, router, user]);

    if (loading || !authorized) {
        return <LoadingPage />;
    }

    return children;
}