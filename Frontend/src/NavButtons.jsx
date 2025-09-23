import { NavLink } from "react-router-dom";
import styles from "./Styles/NavButtons.module.css";

function NavButtons() {
    return (
        <nav className={styles.navbar}>
            <NavLink to="/status" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>Status</NavLink>
            <NavLink
                to="/points"
                end
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
            >
                Points
            </NavLink>

            <NavLink to="/pick-team" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>Pick Team</NavLink>
            <NavLink to="/league" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>League</NavLink>
            <NavLink to="/fixtures" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>Fixtures</NavLink>
            <NavLink to="/scout" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>Scout</NavLink>
            <NavLink to="/draft-room" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>Draft Room</NavLink>
            <NavLink to="/test" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>Test</NavLink>
        </nav>
    );
}

export default NavButtons;
