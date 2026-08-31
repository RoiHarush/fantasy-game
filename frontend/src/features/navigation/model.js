const ACTIVE_LEAGUE_ITEMS = [
    ["/status", "Status"],
    ["/points", "Points"],
    ["/pick-team", "Pick Team"],
    ["/league", "League"],
    ["/fixtures", "Fixtures"],
    ["/scout", "Scout"],
    ["/transfer-window", "Transfer Window"],
    ["/draft-room", "Draft Room"],
];

const PRE_DRAFT_ITEMS = [
    ["/status", "Status"],
    ["/league", "League"],
    ["/fixtures", "Fixtures"],
    ["/scout", "Scout"],
    ["/draft-room", "Draft Room"],
];

const SETTINGS_ITEM = ["/settings", "Settings"];
const LEAGUE_CONTROL_ITEM = ["/league-control", "League Control", "admin"];

function toNavigationItem([href, label, kind = "default"]) {
    return {
        href,
        label,
        kind,
        mobilePrimary: ["/status", "/points", "/pick-team", "/league"].includes(href),
        mobileQuickMenu: ["/scout", "/transfer-window", "/draft-room"].includes(href),
        section: href === "/settings"
            ? "account"
            : kind === "admin"
                ? "management"
                : "league",
    };
}

export function getSiteNavigation(user) {
    if (!user?.leagueId) {
        return [
            ["/scout", "Scout"],
            ["/onboarding", "Create / Join League"],
        ].map(toNavigationItem).map((item) => (
            item.href === "/scout" ? { ...item, mobilePrimary: true, mobileQuickMenu: false } : item
        ));
    }

    const leagueItems = user.leagueStatus === "ACTIVE" ? ACTIVE_LEAGUE_ITEMS : PRE_DRAFT_ITEMS;
    const items = [...leagueItems];

    if (user.leagueAdmin) items.push(LEAGUE_CONTROL_ITEM);
    items.push(SETTINGS_ITEM);

    return items.map(toNavigationItem);
}

export function isNavigationItemActive(pathname, href) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function getMobilePrimaryNavigation(items) {
    return items.filter((item) => item.mobilePrimary);
}

export function getMobileSecondaryNavigation(items) {
    return items.filter((item) => !item.mobilePrimary && !item.mobileQuickMenu);
}

export function getMobileQuickMenuNavigation(items) {
    return items.filter((item) => item.mobileQuickMenu);
}
