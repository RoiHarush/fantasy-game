import { getRankLabel } from "../../../features/status/model";
import ColumnsBlock from "../../Blocks/ColumnsBlock";
import DailyStatusTable from "./DailyStatusTable";
import IRStatusTable from "./IRStatusTable";
import PlayerOfTheWeekBlock from "./PlayerOfTheWeekBlock";
import { useUserGameweekPoints } from "../../../features/points/usePointSummaries";
import { useDailyStatus } from "../../../features/status/useStatusData";
import TransferActivityList from "./TransferActivityList";
import UpcomingDeadlines from "./UpcomingDeadlines";

function Status({
    user,
    league,
    currentGameweek,
    nextGameweek,
    preSeason = false,
    seasonComplete = false,
    transferHistoryGameweekId,
    refreshGameweeks,
}) {
    const pointsQuery = useUserGameweekPoints(user?.id, currentGameweek?.id, !preSeason);
    const dailyStatusQuery = useDailyStatus(currentGameweek?.id, !preSeason);
    const gwPoints = pointsQuery.isPending ? "…" : pointsQuery.data ?? "-";
    const dailyStatus = dailyStatusQuery.data ?? [];
    const leagueUser = league?.users?.find((leagueMember) => String(leagueMember.id) === String(user.id));
    const isCalculated = currentGameweek?.calculated === true;

    return (
        <div className="flex w-full min-w-0 flex-col gap-5 overflow-x-clip">
            <h1 className="text-balance break-words text-xl leading-tight font-bold tracking-tight text-app-foreground sm:text-3xl">
                Current Team - {user.fantasyTeamName}
            </h1>

            {preSeason ? (
                <ColumnsBlock title="Before Gameweek 1" columns={1}>
                    <div>
                        <p>Your initial squad is ready.</p>
                        <h2 className="bg-linear-to-r from-brand-green via-brand-green to-brand-cyan bg-clip-text text-center text-[clamp(1.75rem,7vw,3.125rem)] leading-tight font-bold text-transparent">
                            The season has not started yet
                        </h2>
                    </div>
                </ColumnsBlock>
            ) : <ColumnsBlock title={seasonComplete ? "Season complete" : currentGameweek?.name || "Gameweek"} columns={2}>
                <div>
                    <p>{currentGameweek?.name} points</p>
                    <h2 className="bg-linear-to-r from-brand-green to-brand-cyan bg-clip-text text-center text-[clamp(1.75rem,7vw,3.125rem)] leading-tight font-bold text-transparent">
                        {pointsQuery.error ? "Unavailable" : gwPoints}
                    </h2>
                </div>

                <div>
                    <p>{league?.name}</p>
                    <h2 className="bg-linear-to-r from-brand-green to-brand-cyan bg-clip-text text-center text-[clamp(1.75rem,7vw,3.125rem)] leading-tight font-bold text-transparent">
                        {getRankLabel(leagueUser?.rank)}
                    </h2>
                </div>
            </ColumnsBlock>}

            {dailyStatusQuery.error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    Daily gameweek status is temporarily unavailable.
                </p>
            )}
            {dailyStatus.length > 0 && (
                <DailyStatusTable
                    dailyStatus={dailyStatus}
                    isGameweekFinished={isCalculated}
                />
            )}

            {!seasonComplete && (
                <>
                    <h3 className="text-xl font-bold text-app-foreground">Upcoming deadlines</h3>
                    <UpcomingDeadlines gameweek={nextGameweek} onDeadlineReached={refreshGameweeks} />
                </>
            )}

            {!preSeason && <PlayerOfTheWeekBlock gameweekId={currentGameweek?.id} />}
            <TransferActivityList gameWeekId={transferHistoryGameweekId} />
            <IRStatusTable />
        </div>
    );
}

export default Status;
