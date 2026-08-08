import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { hasServerSession, ServerApiError, serverApiRequest } from "./api";

export const getCurrentSession = cache(async () => {
    if (!await hasServerSession()) {
        return { user: null, invalidSession: false };
    }

    try {
        return {
            user: await serverApiRequest("/api/auth/me"),
            invalidSession: false,
        };
    } catch (error) {
        if (error instanceof ServerApiError && error.status === 401) {
            return { user: null, invalidSession: true };
        }
        console.error("Unable to verify the current session:", error);
        return { user: null, invalidSession: false };
    }
});

export const getCurrentUser = cache(async () => (await getCurrentSession()).user);

export async function requireAuthenticatedUser() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return user;
}

export async function requireSiteUser() {
    const user = await requireAuthenticatedUser();
    if (user.role === "ROLE_SUPER_ADMIN") redirect("/admin");
    return user;
}

export async function requireSuperAdmin() {
    const user = await requireAuthenticatedUser();
    if (user.role !== "ROLE_SUPER_ADMIN") redirect("/status");
    return user;
}

export async function requireLeagueUser() {
    const user = await requireSiteUser();
    if (!user.leagueId) redirect("/onboarding");
    return user;
}

export async function requireActiveLeagueUser() {
    const user = await requireLeagueUser();
    if (user.leagueStatus !== "ACTIVE") redirect("/status");
    return user;
}

export async function requireLeagueAdmin() {
    const user = await requireLeagueUser();
    if (!user.leagueAdmin) redirect("/status");
    return user;
}

export async function requireUserWithoutLeague() {
    const user = await requireSiteUser();
    if (user.leagueId) redirect("/status");
    return user;
}
