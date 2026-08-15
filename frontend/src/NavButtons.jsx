"use client";

import {
    Beaker,
    CalendarDays,
    ChevronDown,
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

export default function NavButtons() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isLoggingOut, startLogout] = useTransition();
    const [openMenuPath, setOpenMenuPath] = useState(null);
    const navigationItems = getSiteNavigation(user);
    const isMenuOpen = openMenuPath === pathname;

    if (process.env.NODE_ENV === "development") {
        navigationItems.push({ href: "/ui-lab", label: "UI Lab", kind: "admin", mobilePrimary: false, section: "management" });
    }

    const activeItem = navigationItems.find(({ href }) => isNavigationItemActive(pathname, href));
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
                        const isActive = isNavigationItemActive(pathname, href);

                        return (
                            <Link
                                key={href}
                                href={href}
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

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={cn(DESKTOP_LINK_CLASS, "ml-auto border-0 bg-transparent text-red-400 hover:text-red-300 after:bg-red-400 disabled:opacity-55")}
                    >
                        {isLoggingOut ? "Logging out…" : "Logout"}
                    </Button>
                </div>
            </nav>

            <div className="relative h-12 w-full rounded-b-xl bg-black/25 px-2 lg:hidden">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenMenuPath(isMenuOpen ? null : pathname)}
                    className="flex h-full w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-white transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/75"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-secondary-navigation"
                    aria-label={`${isMenuOpen ? "Close" : "Open"} navigation menu. Current page: ${activeItem?.label || "Navigation"}`}
                >
                    <span className="min-w-0">
                        <span className="block text-[0.58rem] font-black uppercase tracking-[0.15em] text-white/55">Current page</span>
                        <span className="block truncate text-sm font-extrabold">{activeItem?.label || "Navigation"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 rounded-lg border border-white/35 bg-black/20 px-3 py-1.5 text-xs font-extrabold shadow-sm">
                        {isMenuOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
                        Menu
                        <ChevronDown className={cn("size-3.5 transition-transform", isMenuOpen && "rotate-180")} aria-hidden="true" />
                    </span>
                </Button>

                {isMenuOpen && (
                    <nav
                        id="mobile-secondary-navigation"
                        className="absolute left-2 right-2 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-2xl border border-app-border bg-app-surface text-app-foreground shadow-[0_22px_64px_rgba(27,16,53,0.24)] dark:border-[#5d4172] dark:bg-[#100918] dark:shadow-[0_24px_72px_rgba(0,0,0,0.78)]"
                        aria-label="More navigation"
                    >
                        <div className="border-b border-app-border bg-app-surface-muted/80 px-4 py-3 dark:border-[#503b60] dark:bg-[#26172f]">
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-muted dark:text-[#cbb8d8]">Navigation</p>
                            <p className="mt-0.5 text-sm font-extrabold text-app-foreground dark:text-white">Choose a screen</p>
                        </div>

                        <div className="divide-y divide-app-border dark:divide-[#4a3857]">
                            {secondarySections.map(({ section, label, items }) => (
                                <section
                                    key={section}
                                    className={cn("px-2 py-3", SECTION_STYLES[section].section)}
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
                                            const isActive = isNavigationItemActive(pathname, href);
                                            const ItemIcon = SECONDARY_ICONS[href] || Settings2;
                                            const styles = SECTION_STYLES[section];

                                            return (
                                                <Link
                                                    key={href}
                                                    href={href}
                                                    onClick={() => {
                                                        setOpenMenuPath(null);
                                                    }}
                                                    aria-current={isActive ? "page" : undefined}
                                                    className={cn(
                                                        "relative flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-sm font-bold text-app-foreground no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent dark:text-[#f5eff9]",
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

                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="m-2 mt-1 flex min-h-11 w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-xl border border-app-danger-border bg-app-danger-surface px-3 py-2 text-sm font-extrabold text-app-danger-foreground transition pointer-fine:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-danger-foreground disabled:opacity-55"
                        >
                            <LogOut className="size-4" aria-hidden="true" />
                            {isLoggingOut ? "Logging out…" : "Logout"}
                        </Button>
                    </nav>
                )}
            </div>

            {mobilePrimaryItems.length > 0 && (
                <nav
                    className="fixed inset-x-0 bottom-0 z-[60] h-[calc(3.375rem+max(0.35rem,env(safe-area-inset-bottom)))] border-t border-white/15 bg-[#160b27]/96 px-1.5 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] text-white shadow-[0_-12px_38px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:hidden"
                    aria-label="Mobile quick navigation"
                >
                    <div className="grid h-12 grid-flow-col auto-cols-fr">
                        {mobilePrimaryItems.map(({ href, label }) => {
                            const isActive = isNavigationItemActive(pathname, href);

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-label={MOBILE_LABELS[href] || label}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "relative h-12 min-w-0 overflow-hidden rounded-2xl px-1 font-bold text-white/55 no-underline transition-[background-color,color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
                                        isActive && "bg-white/10 text-white",
                                    )}
                                >
                                    {isActive && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-linear-to-r from-brand-cyan to-brand-purple" aria-hidden="true" />}
                                    <span className="absolute top-1.5 left-1/2 grid size-5 -translate-x-1/2 place-items-center">
                                        <MobileNavigationIcon href={href} active={isActive} />
                                    </span>
                                    <span className={cn(
                                        "absolute inset-x-1 bottom-1 truncate text-center text-[0.62rem] leading-4",
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
                    className="fixed inset-0 z-30 h-auto w-auto cursor-default rounded-none bg-black/50 p-0 backdrop-blur-[1px] lg:hidden"
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

    const iconClass = cn("size-[1.15rem] shrink-0", active && "text-brand-cyan");
    return <Icon className={iconClass} aria-hidden="true" />;
}
