"use client";

import {
    Beaker,
    CalendarDays,
    LogOut,
    Menu,
    MobilePointsIcon,
    MobileScoutIcon,
    MobileStatusIcon,
    MobileTeamIcon,
    MobileTransfersIcon,
    Settings2,
    ShieldCheck,
    Shirt,
    UserRound,
    UsersRound,
    WaiverAdd,
    X,
} from "./shared/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useAuth } from "./Context/AuthContext";
import {
    getMobilePrimaryNavigation,
    getMobileSecondaryNavigation,
    getSiteNavigation,
    isNavigationItemActive,
} from "./features/navigation/model";
import { cn } from "./lib/cn";
import { Button } from "./shared/ui/Button";

const DESKTOP_LINK_CLASS = "group relative inline-flex h-full shrink-0 items-center px-3 text-[0.92rem] font-semibold text-white/85 no-underline transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/75 after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-0 after:-translate-x-1/2 after:rounded-t after:bg-white after:transition-[width] after:duration-200 hover:after:w-[calc(100%-1rem)]";
const MOBILE_ICONS = {
    "/status": MobileStatusIcon,
    "/points": MobilePointsIcon,
    "/pick-team": MobileTeamIcon,
    "/scout": MobileScoutIcon,
    "/transfer-window": MobileTransfersIcon,
};
const MOBILE_LABELS = {
    "/pick-team": "Team",
    "/transfer-window": "Transfers",
};
const SECTION_LABELS = {
    league: "League",
    management: "Management",
    account: "Account",
};
const SECONDARY_ICONS = {
    "/league": UsersRound,
    "/fixtures": CalendarDays,
    "/draft-room": Shirt,
    "/league-control": ShieldCheck,
    "/settings": UserRound,
    "/onboarding": WaiverAdd,
    "/ui-lab": Beaker,
};
const SECTION_STYLES = {
    league: {
        section: "dark:bg-[#191022]",
        heading: "text-app-accent-foreground dark:text-[#dfc4ff]",
        icon: "border-app-accent-border bg-app-accent-surface text-app-accent-foreground dark:border-[#765299] dark:bg-[#321e44] dark:text-[#ead8ff]",
        active: "border-app-accent-border bg-app-accent-surface text-app-accent-foreground dark:border-[#8d63b5] dark:bg-[#3a2350] dark:text-white",
        marker: "bg-brand-purple",
    },
    management: {
        section: "dark:bg-[#101e1d]",
        heading: "text-app-positive-foreground dark:text-[#86f5cf]",
        icon: "border-app-positive-border bg-app-positive-surface text-app-positive-foreground dark:border-[#2d806b] dark:bg-[#153b32] dark:text-[#8ff8d5]",
        active: "border-app-positive-border bg-app-positive-surface text-app-positive-foreground dark:border-[#38a184] dark:bg-[#17493c] dark:text-white",
        marker: "bg-brand-green",
    },
    account: {
        section: "dark:bg-[#101b25]",
        heading: "text-sky-800 dark:text-[#a9efff]",
        icon: "border-sky-200 bg-sky-50 text-sky-800 dark:border-[#28758a] dark:bg-[#163744] dark:text-[#b9f4ff]",
        active: "border-sky-200 bg-sky-50 text-sky-900 dark:border-[#3897ad] dark:bg-[#194554] dark:text-white",
        marker: "bg-brand-cyan",
    },
};

export default function NavButtons({
    userOverride = null,
    navigationBase = "",
    activePath = null,
    observerMode = false,
} = {}) {
    const { user: authenticatedUser, logout } = useAuth();
    const pathname = usePathname();
    const user = userOverride ?? authenticatedUser;
    const navigationPathname = activePath ?? pathname;
    const [isLoggingOut, startLogout] = useTransition();
    const [openMenuPath, setOpenMenuPath] = useState(null);
    const navigationItems = getSiteNavigation(user);
    const isMenuOpen = openMenuPath === pathname;
    const buildHref = (href) => navigationBase ? `${navigationBase}${href}` : href;

    if (process.env.NODE_ENV === "development" && !observerMode) {
        navigationItems.push({ href: "/ui-lab", label: "UI Lab", kind: "admin", mobilePrimary: false, section: "management" });
    }

    const activeItem = navigationItems.find(({ href }) => isNavigationItemActive(navigationPathname, href));
    const mobilePrimaryItems = getMobilePrimaryNavigation(navigationItems);
    const mobileSecondaryItems = getMobileSecondaryNavigation(navigationItems);
    const secondarySections = Object.entries(SECTION_LABELS)
        .map(([section, label]) => ({
            section,
            label,
            items: mobileSecondaryItems.filter((item) => item.section === section),
        }))
        .filter(({ items }) => items.length > 0);

    useEffect(() => {
        if (!isMenuOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") setOpenMenuPath(null);
        };

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [isMenuOpen]);

    function handleLogout() {
        setOpenMenuPath(null);
        startLogout(async () => {
            await logout();
        });
    }

    return (
        <>
            <nav className="hidden h-12 w-full items-center overflow-x-auto rounded-b-xl bg-black/25 px-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.3)_rgba(0,0,0,0.1)] lg:flex" aria-label="Primary navigation">
                <div className="flex h-full min-w-max flex-1 items-center gap-1">
                    {navigationItems.map(({ href, label, kind }) => {
                        const isActive = isNavigationItemActive(navigationPathname, href);

                        return (
                            <Link
                                key={href}
                                href={buildHref(href)}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    DESKTOP_LINK_CLASS,
                                    isActive && "font-extrabold text-white after:w-[calc(100%-1rem)]",
                                    kind === "admin" && "text-[#5ff3e4] hover:text-[#8dfff3] after:bg-[#5ff3e4]",
                                )}
                            >
                                {label}
                            </Link>
                        );
                    })}

                    {observerMode ? (
                        <Button asChild variant="ghost" className={cn(DESKTOP_LINK_CLASS, "ml-auto border-0 bg-transparent text-cyan-200 hover:text-white after:bg-cyan-300")}>
                            <Link href="/admin/observe">Exit read-only view</Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={cn(DESKTOP_LINK_CLASS, "ml-auto border-0 bg-transparent text-red-400 hover:text-red-300 after:bg-red-400 disabled:opacity-55")}
                        >
                            {isLoggingOut ? "Logging out…" : "Logout"}
                        </Button>
                    )}
                </div>
            </nav>

            <div className="relative flex h-14 w-full items-center gap-3 rounded-b-xl bg-black/25 px-3 lg:hidden">
                <div className="min-w-0 flex-1 text-left text-white">
                    <span className="block text-[0.58rem] font-black uppercase tracking-[0.15em] text-white/55">Current page</span>
                    <span className="block truncate text-sm font-extrabold">{activeItem?.label || "Navigation"}</span>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenMenuPath(isMenuOpen ? null : pathname)}
                    className="ml-auto grid size-11 shrink-0 place-items-center rounded-xl border border-white/30 bg-black/20 p-0 text-white shadow-sm transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-secondary-navigation"
                    aria-label={`${isMenuOpen ? "Close" : "Open"} navigation menu. Current page: ${activeItem?.label || "Navigation"}`}
                >
                    {isMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
                </Button>

                {isMenuOpen && (
                    <nav
                        id="mobile-secondary-navigation"
                        className="mobile-secondary-menu absolute right-2 top-[calc(100%+0.35rem)] z-[80] flex max-h-[calc(100dvh-9rem)] w-[min(17rem,calc(100vw-1rem))] origin-top-right flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface text-app-foreground shadow-[0_18px_48px_rgba(27,16,53,0.3)] dark:border-[#5d4172] dark:bg-[#100918] dark:shadow-[0_20px_54px_rgba(0,0,0,0.72)]"
                        aria-label="More navigation"
                    >
                        <div className="shrink-0 border-b border-app-border bg-app-surface-muted/80 px-3 py-2.5 dark:border-[#503b60] dark:bg-[#26172f]">
                            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-app-muted dark:text-[#cbb8d8]">Navigation</p>
                            <p className="mt-0.5 truncate text-sm font-extrabold text-app-foreground dark:text-white">Choose a screen</p>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-app-border dark:divide-[#4a3857]">
                            {secondarySections.map(({ section, label, items }) => (
                                <section
                                    key={section}
                                    className={cn("px-2 py-2.5", SECTION_STYLES[section].section)}
                                    aria-labelledby={`mobile-section-${section}`}
                                >
                                    <h2
                                        id={`mobile-section-${section}`}
                                        className={cn(
                                            "px-2 pb-1.5 text-[0.64rem] font-black uppercase tracking-[0.16em]",
                                            SECTION_STYLES[section].heading,
                                        )}
                                    >
                                        {label}
                                    </h2>
                                    <div className="flex flex-col">
                                        {items.map(({ href, label: itemLabel, kind }) => {
                                            const isActive = isNavigationItemActive(navigationPathname, href);
                                            const ItemIcon = SECONDARY_ICONS[href] || Settings2;
                                            const styles = SECTION_STYLES[section];

                                            return (
                                                <Link
                                                    key={href}
                                                    href={buildHref(href)}
                                                    onClick={() => {
                                                        setOpenMenuPath(null);
                                                    }}
                                                    aria-current={isActive ? "page" : undefined}
                                                    className={cn(
                                                        "relative flex min-h-12 items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-sm font-bold text-app-foreground no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent dark:text-[#f5eff9]",
                                                        "pointer-fine:hover:bg-app-accent-hover dark:pointer-fine:hover:border-white/10 dark:pointer-fine:hover:bg-white/8",
                                                        isActive && cn("font-extrabold shadow-sm", styles.active),
                                                        kind === "admin" && !isActive && "text-app-positive-foreground",
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "absolute inset-y-2 left-0 w-0.5 rounded-full opacity-0",
                                                            styles.marker,
                                                            isActive && "opacity-100",
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", styles.icon)} aria-hidden="true">
                                                        <ItemIcon className="size-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1 leading-tight">{itemLabel}</span>
                                                    {isActive && (
                                                        <span className="shrink-0 text-[0.6rem] font-black uppercase tracking-[0.12em] opacity-70">
                                                            Current
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {observerMode ? (
                            <Button asChild variant="secondary" className="m-2 mt-1 flex min-h-11 w-[calc(100%-1rem)] shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-extrabold">
                                <Link href="/admin/observe" onClick={() => setOpenMenuPath(null)}>
                                    <LogOut className="size-4" aria-hidden="true" />
                                    Exit read-only view
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="m-2 mt-1 flex min-h-11 w-[calc(100%-1rem)] shrink-0 items-center justify-center gap-2 rounded-xl border border-app-danger-border bg-app-danger-surface px-3 py-2 text-sm font-extrabold text-app-danger-foreground transition pointer-fine:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-danger-foreground disabled:opacity-55"
                            >
                                <LogOut className="size-4" aria-hidden="true" />
                                {isLoggingOut ? "Logging out…" : "Logout"}
                            </Button>
                        )}
                    </nav>
                )}
            </div>

            {mobilePrimaryItems.length > 0 && (
                <nav
                    className="fixed inset-x-0 bottom-0 z-[60] h-[calc(4.5rem+max(0.35rem,env(safe-area-inset-bottom)))] border-t border-white/15 bg-[#160b27]/96 px-1.5 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] text-white shadow-[0_-12px_38px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:hidden"
                    aria-label="Mobile quick navigation"
                >
                    <div className="grid h-16 grid-flow-col auto-cols-fr gap-0.5">
                        {mobilePrimaryItems.map(({ href, label }) => {
                            const isActive = isNavigationItemActive(navigationPathname, href);

                            return (
                                <Link
                                    key={href}
                                    href={buildHref(href)}
                                    aria-label={MOBILE_LABELS[href] || label}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "relative h-16 min-w-0 overflow-hidden rounded-2xl px-1 font-bold text-white/60 no-underline transition-[background-color,color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
                                        isActive && "bg-white/10 text-white",
                                    )}
                                >
                                    {isActive && <span className="absolute top-0 left-1/2 h-0.5 w-9 -translate-x-1/2 rounded-full bg-linear-to-r from-brand-cyan to-brand-purple" aria-hidden="true" />}
                                    <span className="absolute top-2 left-1/2 grid size-7 -translate-x-1/2 place-items-center">
                                        <MobileNavigationIcon href={href} active={isActive} />
                                    </span>
                                    <span className={cn(
                                        "absolute inset-x-1 bottom-1.5 truncate text-center text-[0.7rem] leading-4",
                                    )}>
                                        {MOBILE_LABELS[href] || label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {isMenuOpen && (
                <Button
                    type="button"
                    variant="ghost"
                    className="fixed inset-0 z-[70] h-auto w-auto cursor-default rounded-none bg-black/40 p-0 backdrop-blur-[1px] lg:hidden"
                    onClick={() => setOpenMenuPath(null)}
                    aria-label="Close navigation menu"
                />
            )}
        </>
    );
}

function MobileNavigationIcon({ href, active }) {
    const Icon = MOBILE_ICONS[href];
    if (!Icon) return null;

    const iconClass = cn("size-[1.45rem] shrink-0", active && "text-brand-cyan");
    return <Icon className={iconClass} aria-hidden="true" />;
}
