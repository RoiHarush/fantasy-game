import { formatAppLongDate } from "../../../lib/dateTime";
import styles from "../../../Styles/Status.module.css";

function DailyStatusTable({ dailyStatus, isGameweekFinished }) {
    return (
        <div className={styles.dailyTableContainer} role="table" aria-label="Daily gameweek status">
            <div className={styles.tableHeader} role="row">
                <span role="columnheader">Day</span>
                <span role="columnheader">Match Points</span>
            </div>

            <div className={styles.tableRows} role="rowgroup">
                {dailyStatus.map((day, index) => (
                    <div key={Array.isArray(day.date) ? day.date.join("-") : day.date ?? index} className={styles.tableRow} role="row">
                        <div className={styles.dateCell} role="cell">
                            {formatAppLongDate(day.date) || "Date unavailable"}
                        </div>
                        <div className={styles.statusCell} role="cell">
                            {day.isCalculated ? (
                                <span className={styles.pointsAdded}>Points Added</span>
                            ) : (
                                <span className={styles.liveText}>LIVE</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`${styles.summaryBar} ${isGameweekFinished ? styles.summaryFinal : styles.summaryLive}`}>
                {isGameweekFinished ? (
                    <>
                        <span>Gameweek Finished</span>
                        <span className={styles.badge}>UPDATED</span>
                    </>
                ) : (
                    <>
                        <span>Gameweek in Progress</span>
                        <span className={styles.badge}>LIVE</span>
                    </>
                )}
            </div>
        </div>
    );
}

export default DailyStatusTable;
