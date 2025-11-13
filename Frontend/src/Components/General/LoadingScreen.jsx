import styles from "../../Styles/LoadingScreen.module.css";

export default function LoadingScreen() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.spinner}></div>
            <p className={styles.text}>Loading Fantasy Data...</p>
        </div>
    );
}