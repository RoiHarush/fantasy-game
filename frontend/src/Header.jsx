import { useLocation } from "react-router-dom";
import styles from "./Styles/Header.module.css";
import headerLogo from "/UI/draft-logo.svg";
import NavButtons from "./NavButtons";

function Header() {
    const location = useLocation();

    const isPointsActive = location.pathname === "/points";

    return (
        <header className={styles.header}>
            <div className={styles.topSection}>
                <div className={styles.topBar}>
                    <img src={headerLogo} alt="Fantasy Draft Logo" className={styles.logo} />
                    <span className={styles.version}>(The Fun Version)</span>
                </div>
                <img src="/UI/pattern-1_header.png" alt="" className={styles.pattern} />
            </div>

            <div className={styles.navBar}>
                <NavButtons isPointsActive={isPointsActive} />
            </div>
        </header>
    );
}

export default Header;

