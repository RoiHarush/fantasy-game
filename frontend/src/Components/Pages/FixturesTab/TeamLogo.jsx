import styles from "../../../Styles/FixturesTable.module.css";

function TeamLogo({ team }) {
    const localFallback = `/Logos/${team?.id ?? 0}_logo.svg`;
    const badgeUrl = team?.badgeUrl || localFallback;

    function useFallback(event) {
        if (event.currentTarget.dataset.fallbackApplied === "true") return;
        event.currentTarget.dataset.fallbackApplied = "true";
        event.currentTarget.src = localFallback;
    }

    return (
        <img
            src={badgeUrl}
            alt={`${team?.name || "Unknown team"} logo`}
            width="48"
            height="48"
            loading="lazy"
            className={styles["team-logo"]}
            onError={useFallback}
        />
    );
}

export default TeamLogo;
