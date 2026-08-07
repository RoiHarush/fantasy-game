import Link from "next/link";
import styles from "../src/Styles/NotFoundPage.module.css";

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.errorCode}>404</h1>
                <h2 className={styles.title}>Offside!</h2>
                <p className={styles.description}>
                    It looks like you&apos;ve wandered out of position.
                    The page you are looking for doesn&apos;t exist or has been transferred to another league.
                </p>

                <Link href="/" className={styles.homeButton}>
                    Return to Pitch
                </Link>
            </div>
        </div>
    );
}