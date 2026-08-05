"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Styles/NavButtons.module.css";
import { useAuth } from "./Context/AuthContext";

function NavButtons() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    function handleLogout(e) {
        e.preventDefault();
        logout();
    }

    const isAdmin = Boolean(user?.leagueAdmin);

    const getClassName = (href, exact = false, extraClassName = "") => {
        const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return isActive ? `${styles.navLink} ${styles.activeLink} ${extraClassName}`.trim() : `${styles.navLink} ${extraClassName}`.trim();
    };

    if (!user?.leagueId) {
        return (
            <nav className={styles.navbar}>
                <Link href="/scout" className={styles.navLink}>Scout</Link>
                <Link href="/onboarding" className={styles.navLink}>Create / Join League</Link>
                <a href="/" onClick={handleLogout} className={`${styles.navLink} ${styles.logoutLink}`}>
                    Logout
                </a>
            </nav>
        );
    }

    if (user.leagueStatus !== "ACTIVE") {
        return (
            <nav className={styles.navbar}>
                <Link href="/status" className={getClassName("/status", true)}>Status</Link>
                <Link href="/league" className={getClassName("/league", true)}>League</Link>
                <Link href="/scout" className={getClassName("/scout", true)}>Scout</Link>
                <Link href="/draft-room" className={getClassName("/draft-room", true)}>Draft Room</Link>
                {isAdmin && <Link href="/league-control" className={getClassName("/league-control", true)}>League Control</Link>}
                <Link href="/settings" className={getClassName("/settings", true)}>Settings</Link>
                <a href="/" onClick={handleLogout} className={`${styles.navLink} ${styles.logoutLink}`}>
                    Logout
                </a>
            </nav>
        );
    }

    return (
        <nav className={styles.navbar}>
            <Link href="/status" className={getClassName("/status", true)}>
                Status
            </Link>

            <Link href="/points" className={getClassName("/points", true)}>
                Points
            </Link>

            <Link href="/pick-team" className={getClassName("/pick-team", true)}>
                Pick Team
            </Link>

            <Link href="/league" className={getClassName("/league", true)}>
                League
            </Link>

            <Link href="/fixtures" className={getClassName("/fixtures", true)}>
                Fixtures
            </Link>

            <Link href="/scout" className={getClassName("/scout", true)}>
                Scout
            </Link>

            <Link href="/transfer-window" className={getClassName("/transfer-window", true)}>
                Transfer Window
            </Link>

            <Link href="/draft-room" className={getClassName("/draft-room", true)}>
                Draft Room
            </Link>

            <Link href="/waivers" className={getClassName("/waivers", true)}>
                Waivers
            </Link>

            {isAdmin && (
                <Link
                    href="/league-control"
                    style={{
                        color: '#3dd2c2',
                        borderColor: '#5ff3e4'
                    }}
                    className={getClassName("/league-control", true)}
                >
                    League Control
                </Link>
            )}

            <Link href="/settings" className={getClassName("/settings", true)}>
                Settings
            </Link>


            <a
                href="/"
                onClick={handleLogout}
                className={`${styles.navLink} ${styles.logoutLink}`}
            >
                Logout
            </a>
        </nav>
    );
}

export default NavButtons;
