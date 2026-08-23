export const OBSERVER_SCREENS = new Set([
    "status",
    "points",
    "pick-team",
    "league",
    "fixtures",
    "scout",
    "transfer-window",
    "draft-room",
    "league-control",
    "settings",
]);

export function getObserverScreenHref(leagueId, managerId, screen) {
    if (!OBSERVER_SCREENS.has(screen)) {
        throw new Error(`Unsupported observer screen: ${screen}`);
    }
    return `/observe/${encodeURIComponent(leagueId)}/${encodeURIComponent(managerId)}/${screen}`;
}
