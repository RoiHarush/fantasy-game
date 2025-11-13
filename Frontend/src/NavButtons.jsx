import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Styles/NavButtons.module.css";
import API_URL from "./config";

function NavButtons() {
    const navigate = useNavigate();

    async function handleLogout() {
        const token = sessionStorage.getItem("token");

        if (token) {
            try {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (err) {
                console.error("Logout request failed:", err);
            }
        }

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("loggedUser");
        navigate(0);
    }

    return (
        <nav className={styles.navbar}>
            <NavLink
                to="/status"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Status
            </NavLink>

            <NavLink
                to="/points"
                end
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Points
            </NavLink>

            <NavLink
                to="/pick-team"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Pick Team
            </NavLink>

            <NavLink
                to="/league"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                League
            </NavLink>

            <NavLink
                to="/fixtures"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Fixtures
            </NavLink>

            <NavLink
                to="/scout"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Scout
            </NavLink>

            <NavLink
                to="/transfer-window"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Transfer Window
            </NavLink>

            {/* <NavLink
                to="/draft-room"
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.activeLink}`
                        : styles.navLink
                }
            >
                Draft Room
            </NavLink> */}

            <NavLink
                to="/"
                onClick={handleLogout}
                className={({ isActive }) =>
                    isActive
                        ? `${styles.navLink} ${styles.logoutLink} ${styles.activeLink}`
                        : `${styles.navLink} ${styles.logoutLink}`
                }
            >
                Logout
            </NavLink>
        </nav>
    );
}

export default NavButtons;