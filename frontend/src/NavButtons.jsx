"use client";

import {
    ChevronDown,
    LogOut,
    Menu,
    MobilePointsIcon,
    MobileScoutIcon,
    MobileStatusIcon,
    MobileTeamIcon,
    MobileTransfersIcon,
    X,
} from "./shared/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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

export default function NavButtons() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isLoggingOut, startLogout] = useTransition();
    const [openMenuPath, setOpenMenuPath] = useState(null);
    const [isQuickNavCompact, setIsQuickNavCompact] = useState(false);
    const previousScrollY = useRef(0);
    const scrollDirection = useRef(null);
    const scrollDistance = useRef(0);
    const navigationItems = getSiteNavigation(user);
    const isMenuOpen = openMenuPath === pathname;
    const showQuickNavCompact = isQuickNavCompact && !isMenuOpen;

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

    useEffect(() => {
        previousScrollY.current = Math.max(0, window.scrollY);
        scrollDirection.current = null;
        scrollDistance.current = 0;

        const handleScroll = () => {
            const currentScrollY = Math.max(0, window.scrollY);
            const delta = currentScrollY - previousScrollY.current;
            previousScrollY.current = currentScrollY;

            if (currentScrollY <= 24) {
                scrollDirection.current = null;
                scrollDistance.current = 0;
                setIsQuickNavCompact(false);
                return;
            }

            if (Math.abs(delta) < 2) return;

            const nextDirection = delta > 0 ? "down" : "up";
            if (scrollDirection.current !== nextDirection) {
                scrollDirection.current = nextDirection;
                scrollDistance.current = 0;
            }
            scrollDistance.current += Math.abs(delta);

            if (nextDirection === "down" && currentScrollY > 80 && scrollDistance.current >= 24) {
                setIsQuickNavCompact(true);
                scrollDistance.current = 0;
            } else if (nextDirection === "up" && scrollDistance.current >= 10) {
                setIsQuickNavCompact(false);
                scrollDistance.current = 0;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname]);

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
                    <span className="flex shrink-0 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                        {isMenuOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
                        Menu
                        <ChevronDown className={cn("size-3.5 transition-transform", isMenuOpen && "rotate-180")} aria-hidden="true" />
                    </span>
                </Button>

                {isMenuOpen && (
                    <nav
                        id="mobile-secondary-navigation"
                        className="absolute left-2 right-2 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-2xl border border-white/20 bg-[#211236] p-3 text-white shadow-[0_22px_64px_rgba(0,0,0,0.58)] dark:bg-[#160b27]"
                        aria-label="More navigation"
                    >
                        <p className="px-1 pb-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/55">More screens</p>
                        <div className="space-y-3">
                            {secondarySections.map(({ section, label, items }) => (
                                <section key={section} aria-labelledby={`mobile-section-${section}`}>
                                    <h2 id={`mobile-section-${section}`} className="mb-1 px-1 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-brand-cyan/75">
                                        {label}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {items.map(({ href, label: itemLabel, kind }) => {
                                            const isActive = isNavigationItemActive(pathname, href);

                                            return (
                                                <Link
                                                    key={href}
                                                    href={href}
                                                    onClick={() => {
                                                        setOpenMenuPath(null);
                                                        setIsQuickNavCompact(false);
                                                    }}
                                                    aria-current={isActive ? "page" : undefined}
                                                    className={cn(
                                                        "flex min-h-11 items-center rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-white/82 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                                        isActive && "border-white/18 bg-white/12 font-extrabold text-white shadow-sm",
                                                        kind === "admin" && "text-[#7cf2e5]",
                                                    )}
                                                >
                                                    <span className={cn("mr-2 size-1.5 shrink-0 rounded-full bg-white/30", isActive && "bg-brand-cyan", kind === "admin" && "bg-brand-green")} aria-hidden="true" />
                                                    <span className="min-w-0 leading-tight">{itemLabel}</span>
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
                            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-extrabold text-red-300 transition hover:bg-red-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-55"
                        >
                            <LogOut className="size-4" aria-hidden="true" />
                            {isLoggingOut ? "Logging out…" : "Logout"}
                        </Button>
                    </nav>
                )}
            </div>

            {mobilePrimaryItems.length > 0 && (
                <nav
                    className={cn(
                        "fixed left-1/2 bottom-2 z-[60] -translate-x-1/2 rounded-[1.35rem] border border-white/15 bg-[#160b27]/94 text-white shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[width,padding,transform,opacity] duration-300 ease-out lg:hidden",
                        showQuickNavCompact
                            ? "w-[calc(100%_-_3rem)] max-w-[22rem] px-1.5 pt-1 pb-[max(0.2rem,env(safe-area-inset-bottom))]"
                            : "w-[calc(100%_-_1rem)] max-w-lg px-1.5 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]",
                        isMenuOpen && "pointer-events-none translate-y-3 opacity-0",
                    )}
                    data-compact={showQuickNavCompact ? "true" : "false"}
                    aria-label="Mobile quick navigation"
                >
                    <div className="grid grid-flow-col auto-cols-fr">
                        {mobilePrimaryItems.map(({ href, label }) => {
                            const isActive = isNavigationItemActive(pathname, href);

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setIsQuickNavCompact(false)}
                                    aria-label={MOBILE_LABELS[href] || label}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "relative flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 font-bold text-white/55 no-underline transition-[min-height,gap,background-color,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
                                        showQuickNavCompact ? "min-h-10 gap-0" : "min-h-12 gap-0.5",
                                        isActive && "bg-white/10 text-white",
                                    )}
                                >
                                    {isActive && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-linear-to-r from-brand-cyan to-brand-purple" aria-hidden="true" />}
                                    <MobileNavigationIcon href={href} active={isActive} />
                                    <span className={cn(
                                        "max-w-full overflow-hidden truncate text-[0.62rem] leading-4 transition-[max-height,opacity,transform] duration-300 ease-out",
                                        showQuickNavCompact ? "max-h-0 -translate-y-0.5 opacity-0" : "max-h-4 opacity-100",
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
