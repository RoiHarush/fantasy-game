import { getRankLabel } from "../../../features/status/model";
import ColumnsBlock from "../../Blocks/ColumnsBlock";
import DailyStatusTable from "./DailyStatusTable";
import IRStatusTable from "./IRStatusTable";
import PlayerOfTheWeekBlock from "./PlayerOfTheWeekBlock";
import { useUserGameweekPoints } from "../../../features/points/usePointSummaries";
import { useDailyStatus } from "../../../features/status/useStatusData";
import TransferActivityList from "./TransferActivityList";
import UpcomingDeadlines from "./UpcomingDeadlines";
import GameweekRoast from "./GameweekRoast";
import LeaguePresenceStrip from "./LeaguePresenceStrip";

function Status({
    user,
    league,
    currentGameweek,
    nextGameweek,
    nextTransferGameweek,
    preSeason = false,
    seasonComplete = false,
    transferHistoryGameweekId,
    refreshGameweeks,
    presenceState,
    presenceLoading = false,
    presenceUnavailable = false,
    previewData,
}) {
    const preview = previewData != null;
    const pointsQuery = useUserGameweekPoints(user?.id, currentGameweek?.id, !preSeason && !preview);
    const dailyStatusQuery = useDailyStatus(currentGameweek?.id, !preSeason && !preview);
    const pointsPending = !preview && pointsQuery.isPending;
    const pointsError = !preview && pointsQuery.error;
    const dailyStatusError = !preview && dailyStatusQuery.error;
    const gwPoints = preview ? previewData.points : pointsPending ? "…" : pointsQuery.data ?? "-";
    const dailyStatus = preview ? previewData.dailyStatus ?? [] : dailyStatusQuery.data ?? [];
    const leagueUser = league?.users?.find((leagueMember) => String(leagueMember.id) === String(user.id));
    const isCalculated = currentGameweek?.calculated === true;
    const hasSettledMatchday = dailyStatus.some((day) => day.isCalculated === true);

    return (
        <div className="flex w-full min-w-0 flex-col gap-5 overflow-x-clip">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <h1 className="min-w-0 text-balance break-words text-xl leading-tight font-bold tracking-tight text-app-foreground sm:text-3xl">
                    Current Team - {user.fantasyTeamName}
                </h1>

                {!preview && (
                    <LeaguePresenceStrip
                        members={league?.users}
                        activeUserIds={presenceState?.activeUserIds}
                        loading={presenceLoading}
                        unavailable={presenceUnavailable}
                    />
                )}
            </div>

            <GameweekRoast
                gameweekId={currentGameweek?.id}
                available={!preSeason && (isCalculated || hasSettledMatchday)}
                manualGenerationAllowed={isCalculated}
                unavailableMessage={preSeason
                    ? "The AI roast unlocks after Gameweek 1 is calculated."
                    : "The AI roast unlocks after the first matchday is calculated."}
                readOnly={preview}
                previewFeed={preview ? previewData?.roastFeed ?? null : undefined}
            />

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
                        {pointsError ? "Unavailable" : gwPoints}
                    </h2>
                </div>

                <div>
                    <p>{league?.name}</p>
                    <h2 className="bg-linear-to-r from-brand-green to-brand-cyan bg-clip-text text-center text-[clamp(1.75rem,7vw,3.125rem)] leading-tight font-bold text-transparent">
                        {getRankLabel(leagueUser?.rank)}
                    </h2>
                </div>
            </ColumnsBlock>}

            {dailyStatusError && (
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
                    <UpcomingDeadlines
                        lineupGameweek={nextGameweek}
                        transferGameweek={nextTransferGameweek ?? nextGameweek}
                        onDeadlineReached={refreshGameweeks}
                    />
                </>
            )}

            {!preSeason && <PlayerOfTheWeekBlock userId={user?.id} gameweekId={currentGameweek?.id} previewRecords={previewData?.playersOfTheWeek} previewStandings={previewData?.crownStandings} previewPlayers={previewData?.players} />}
            <TransferActivityList gameWeekId={transferHistoryGameweekId} previewActions={previewData?.transferActions} previewPlayers={previewData?.players} />
            <IRStatusTable previewStatuses={previewData?.irStatuses} />
        </div>
    );
}

export default Status;
