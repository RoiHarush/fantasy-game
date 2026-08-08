"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { useAuth } from "./Context/AuthContext";
import { getSiteNavigation, isNavigationItemActive } from "./features/navigation/model";
import { cn } from "./lib/cn";
import styles from "./Styles/NavButtons.module.css";

export default function NavButtons() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isLoggingOut, startLogout] = useTransition();
    const navigationItems = getSiteNavigation(user);

    function handleLogout() {
        startLogout(async () => {
            await logout();
        });
    }

    return (
        <nav className={styles.navbar} aria-label="Primary navigation">
            {navigationItems.map(({ href, label, kind }) => {
                const isActive = isNavigationItemActive(pathname, href);

                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            styles.navLink,
                            isActive && styles.activeLink,
                            kind === "admin" && styles.adminLink,
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
                className={cn(styles.navLink, styles.logoutLink)}
            >
                {isLoggingOut ? "Logging out…" : "Logout"}
            </button>
        </nav>
    );
}
