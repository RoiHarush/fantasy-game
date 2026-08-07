export function getPostLoginRoute(user) {
    if (!user) return "/login";
    if (user.role === "ROLE_SUPER_ADMIN") return "/admin";
    return user.leagueId ? "/status" : "/onboarding";
}

export function getRootRedirectRoute(user) {
    return getPostLoginRoute(user);
}

export function canAccessAdminRoute(user) {
    return user?.role === "ROLE_SUPER_ADMIN";
}

export function canAccessLeagueRoute(user) {
    return Boolean(user?.leagueId);
}

export function canAccessActiveLeagueRoute(user) {
    return Boolean(user?.leagueId && user?.leagueStatus === "ACTIVE");
}

export function canAccessLeagueControlRoute(user) {
    return Boolean(user?.leagueAdmin);
}

export function getDeniedRedirect(user) {
    if (!user) return "/login";
    if (user.role === "ROLE_SUPER_ADMIN") return "/admin";
    return user.leagueId ? "/status" : "/onboarding";
}
