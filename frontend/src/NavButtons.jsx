"use client";

import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useAuth } from "./Context/AuthContext";
import { getSiteNavigation, isNavigationItemActive } from "./features/navigation/model";
import { cn } from "./lib/cn";

const DESKTOP_LINK_CLASS = "group relative inline-flex h-full shrink-0 items-center px-3 text-[0.92rem] font-semibold text-white/85 no-underline transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/75 after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-0 after:-translate-x-1/2 after:rounded-t after:bg-white after:transition-[width] after:duration-200 hover:after:w-[calc(100%-1rem)]";

export default function NavButtons() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isLoggingOut, startLogout] = useTransition();
    const [openMenuPath, setOpenMenuPath] = useState(null);
    const navigationItems = getSiteNavigation(user);
    const isMenuOpen = openMenuPath === pathname;

    if (process.env.NODE_ENV === "development") {
        navigationItems.push({ href: "/ui-lab", label: "UI Lab", kind: "admin" });
    }

    const activeItem = navigationItems.find(({ href }) => isNavigationItemActive(pathname, href));

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

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={cn(DESKTOP_LINK_CLASS, "ml-auto border-0 bg-transparent text-red-400 hover:text-red-300 after:bg-red-400 disabled:opacity-55")}
                    >
                        {isLoggingOut ? "Logging out…" : "Logout"}
                    </button>
                </div>
            </nav>

            <div className="relative h-12 w-full rounded-b-xl bg-black/25 px-2 lg:hidden">
                <button
                    type="button"
                    onClick={() => setOpenMenuPath(isMenuOpen ? null : pathname)}
                    className="flex h-full w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-white transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/75"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-primary-navigation"
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
                </button>

                {isMenuOpen && (
                    <nav
                        id="mobile-primary-navigation"
                        className="absolute left-2 right-2 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-8.5rem)] overflow-y-auto rounded-2xl border border-white/20 bg-[#211236] p-2.5 text-white shadow-[0_22px_64px_rgba(0,0,0,0.58)] dark:bg-[#160b27]"
                        aria-label="Mobile primary navigation"
                    >
                        <div className="grid grid-cols-2 gap-1.5">
                            {navigationItems.map(({ href, label, kind }) => {
                                const isActive = isNavigationItemActive(pathname, href);

                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setOpenMenuPath(null)}
                                        aria-current={isActive ? "page" : undefined}
                                        className={cn(
                                            "flex min-h-11 items-center rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-white/82 no-underline transition hover:border-white/12 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                            isActive && "border-white/18 bg-white/12 font-extrabold text-white shadow-sm",
                                            kind === "admin" && "text-[#7cf2e5]",
                                        )}
                                    >
                                        <span className={cn("mr-2 size-1.5 shrink-0 rounded-full bg-white/30", isActive && "bg-brand-cyan", kind === "admin" && "bg-brand-green")} aria-hidden="true" />
                                        <span className="min-w-0 leading-tight">{label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-extrabold text-red-300 transition hover:bg-red-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-55"
                        >
                            <LogOut className="size-4" aria-hidden="true" />
                            {isLoggingOut ? "Logging out…" : "Logout"}
                        </button>
                    </nav>
                )}
            </div>

            {isMenuOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default bg-black/50 backdrop-blur-[1px] lg:hidden"
                    onClick={() => setOpenMenuPath(null)}
                    aria-label="Close navigation menu"
                />
            )}
        </>
    );
}
