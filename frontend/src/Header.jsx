import Image from "next/image";

import NavButtons from "./NavButtons";
import styles from "./Styles/Header.module.css";

function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.topSection}>
                <div className={styles.topBar}>
                    <Image
                        src="/UI/draft-logo.svg"
                        alt="Fantasy Draft Logo"
                        className={styles.logo}
                        width={300}
                        height={40}
                        priority
                    />
                    <span className={styles.version}>(The Fun Version)</span>
                </div>
                <Image
                    src="/UI/pattern-1_header.png"
                    alt=""
                    className={styles.pattern}
                    width={480}
                    height={140}
                    priority
                />
            </div>

            <div className={styles.navBar}>
                <NavButtons />
            </div>
        </header>
    );
}

export default Header;

