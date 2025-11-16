import styles from "../../Styles/LoadingPage.module.css";

export default function LoadingPage() {
    return (
        <div className={styles.loadingPage}>
            <div className={styles.spinner}></div>
        </div>
    );
}