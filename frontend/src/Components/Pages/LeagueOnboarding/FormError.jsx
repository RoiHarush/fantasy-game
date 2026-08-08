import styles from "../../../Styles/LeagueOnboarding.module.css";

export default function FormError({ error }) {
    if (!error) return null;

    return (
        <p className={styles.error} role="alert">
            {error.message}
        </p>
    );
}
