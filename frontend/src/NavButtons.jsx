import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Styles/NavButtons.module.css";
import API_URL from "./config";
import { useAuth } from "./Context/AuthContext";

function NavButtons() {
    const { user, logout } = useAuth();

    function handleLogout(e) {
        e.preventDefault();
        logout();
    }

    const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';

    return (
        <nav className={styles.navbar}>
            <NavLink
                to="/status"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Status
            </NavLink>

            <NavLink
                to="/points"
                end
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Points
            </NavLink>

            <NavLink
                to="/pick-team"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Pick Team
            </NavLink>

            <NavLink
                to="/league"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                League
            </NavLink>

            <NavLink
                to="/fixtures"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Fixtures
            </NavLink>

            <NavLink
                to="/scout"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Scout
            </NavLink>

            <NavLink
                to="/transfer-window"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Transfer Window
            </NavLink>

            <NavLink
                to="/draft-room"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Draft Room
            </NavLink>

            {isAdmin && (
                <NavLink
                    to="/league-control"
                    style={{
                        color: '#3dd2c2',
                        borderColor: '#5ff3e4'
                    }}
                    className={({ isActive }) =>
                        isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                    }
                >
                    League Control
                </NavLink>
            )}

            <NavLink
                to="/settings"
                className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                }
            >
                Settings
            </NavLink>


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