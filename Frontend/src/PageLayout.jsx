import styles from "./Styles/PageLayout.module.css";

function PageLayout({ left, right }) {
    return (
        <div className={styles.pageLayout}>
            <div className={styles.leftColumn}>{left}</div>
            <div className={styles.rightColumn}>{right}</div>
        </div>
    );
}

export default PageLayout;

