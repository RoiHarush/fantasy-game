import { formatAppLongDate } from "../../../lib/dateTime";

function DailyStatusTable({ dailyStatus, isGameweekFinished }) {
    return (
        <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm transition-colors" role="table" aria-label="Daily gameweek status">
            <div className="flex justify-between border-b border-app-border bg-app-surface-muted px-4 py-3 text-xs font-semibold tracking-wide text-app-muted uppercase sm:px-5" role="row">
                <span role="columnheader">Day</span>
                <span role="columnheader">Match Points</span>
            </div>

            <div role="rowgroup">
                {dailyStatus.map((day, index) => (
                    <div key={Array.isArray(day.date) ? day.date.join("-") : day.date ?? index} className="flex items-center justify-between border-b border-app-border px-4 py-4 transition-colors last:border-b-0 hover:bg-app-surface-muted sm:px-5" role="row">
                        <div className="text-sm font-semibold text-app-foreground sm:text-base" role="cell">
                            {formatAppLongDate(day.date) || "Date unavailable"}
                        </div>
                        <div role="cell">
                            {day.isCalculated ? (
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Points Added</span>
                            ) : (
                                <span className="font-extrabold tracking-wide text-pink-600 dark:text-pink-400">LIVE</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`flex items-center justify-between px-4 py-3 text-sm font-bold sm:px-5 sm:text-base ${isGameweekFinished ? "bg-brand-green text-brand-ink" : "bg-brand-ink text-white dark:bg-violet-950"}`}>
                {isGameweekFinished ? (
                    <>
                        <span>Gameweek Finished</span>
                        <span className="rounded bg-black/20 px-2 py-1 text-[0.7rem] font-extrabold">UPDATED</span>
                    </>
                ) : (
                    <>
                        <span>Gameweek in Progress</span>
                        <span className="rounded bg-black/20 px-2 py-1 text-[0.7rem] font-extrabold">LIVE</span>
                    </>
                )}
            </div>
        </div>
    );
}

export default DailyStatusTable;
