import styles from "../../Styles/LoadingPage.module.css";

export default function LoadingPage() {
    return (
        <div className={styles.loadingPage} role="status" aria-live="polite">
            <div className={styles.spinner} aria-hidden="true"></div>
            <span className={styles.srOnly}>Loading…</span>
        </div>
    );
}
