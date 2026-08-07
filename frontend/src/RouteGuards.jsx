"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "./Components/General/LoadingPage";
import { useAuth } from "./Context/AuthContext";
import {
    canAccessActiveLeagueRoute,
    canAccessLeagueControlRoute,
    canAccessLeagueRoute,
    getDeniedRedirect,
} from "./Utils/routing";

function Guard({ children, isAllowed }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (loading) {
            setAuthorized(false);
            return;
        }

        if (!isAllowed(user)) {
            setAuthorized(false);
            router.replace(getDeniedRedirect(user));
            return;
        }

        setAuthorized(true);
    }, [isAllowed, loading, router, user]);

    if (loading || !authorized) {
        return <LoadingPage />;
    }

    return children;
}

const hasLeague = (user) => canAccessLeagueRoute(user);
const hasActiveLeague = (user) => canAccessActiveLeagueRoute(user);
const isLeagueAdmin = (user) => canAccessLeagueRoute(user) && canAccessLeagueControlRoute(user);
const hasNoLeague = (user) => Boolean(user && user.role !== "ROLE_SUPER_ADMIN" && !user.leagueId);

export function RequireLeague({ children }) {
    return <Guard isAllowed={hasLeague}>{children}</Guard>;
}

export function RequireActiveLeague({ children }) {
    return <Guard isAllowed={hasActiveLeague}>{children}</Guard>;
}

export function RequireLeagueAdmin({ children }) {
    return <Guard isAllowed={isLeagueAdmin}>{children}</Guard>;
}

export function RequireNoLeague({ children }) {
    return <Guard isAllowed={hasNoLeague}>{children}</Guard>;
}
