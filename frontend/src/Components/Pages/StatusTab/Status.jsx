import { getRankLabel } from "../../../features/status/model";
import { formatAppDateTime } from "../../../lib/dateTime";
import styles from "../../../Styles/Status.module.css";
import ColumnsBlock from "../../Blocks/ColumnsBlock";
import SplitBlock from "../../Blocks/SplitBlock";
import DailyStatusTable from "./DailyStatusTable";
import IRStatusTable from "./IRStatusTable";
import PlayerOfTheWeekBlock from "./PlayerOfTheWeekBlock";
import { useUserGameweekPoints } from "../../../features/points/usePointSummaries";
import { useDailyStatus } from "../../../features/status/useStatusData";
import TransferActivityList from "./TransferActivityList";

function Status({
    user,
    league,
    currentGameweek,
    nextGameweek,
    preSeason = false,
    seasonComplete = false,
    transferHistoryGameweekId,
}) {
    const pointsQuery = useUserGameweekPoints(user?.id, currentGameweek?.id, !preSeason);
    const dailyStatusQuery = useDailyStatus(currentGameweek?.id, !preSeason);
    const gwPoints = pointsQuery.isPending ? "…" : pointsQuery.data ?? "-";
    const dailyStatus = dailyStatusQuery.data ?? [];
    const transferOpens = formatAppDateTime(nextGameweek?.transferOpenTime);
    const gwStart = formatAppDateTime(nextGameweek?.firstKickoffTime);
    const leagueUser = league?.users?.find((leagueMember) => String(leagueMember.id) === String(user.id));
    const isCalculated = currentGameweek?.calculated === true;

    return (
        <div className={styles.statusPage}>
            <h1>Current Team - {user.fantasyTeamName}</h1>

            {preSeason ? (
                <ColumnsBlock title="Before Gameweek 1" columns={1}>
                    <div>
                        <p>Your initial squad is ready.</p>
                        <h2 className={styles.gradientText}>The season has not started yet</h2>
                    </div>
                </ColumnsBlock>
            ) : <ColumnsBlock title={seasonComplete ? "Season complete" : currentGameweek?.name || "Gameweek"} columns={2}>
                <div>
                    <p>{currentGameweek?.name} points</p>
                    <h2 className={styles.gradientText}>{pointsQuery.error ? "Unavailable" : gwPoints}</h2>
                </div>

                <div>
                    <p>{league?.name}</p>
                    <h2 className={styles.gradientText}>{getRankLabel(leagueUser?.rank)}</h2>
                </div>
            </ColumnsBlock>}

            {dailyStatusQuery.error && (
                <p role="alert">Daily gameweek status is temporarily unavailable.</p>
            )}
            {dailyStatus.length > 0 && (
                <DailyStatusTable
                    dailyStatus={dailyStatus}
                    isGameweekFinished={isCalculated}
                />
            )}

            {!seasonComplete && (
                <>
                    <h3>Upcoming deadlines</h3>
                    <SplitBlock
                        items={[
                            {
                                id: "transfer-window",
                                title: "Transfer Window",
                                content: <p>{transferOpens ?? "TBA"}</p>,
                            },
                            {
                                id: "lineup-lock",
                                title: "Lineup Lock",
                                content: <p>{gwStart ?? "TBA"}</p>,
                            },
                        ]}
                    />
                </>
            )}

            {!preSeason && <PlayerOfTheWeekBlock gameweekId={currentGameweek?.id} />}
            <TransferActivityList gameWeekId={transferHistoryGameweekId} />
            <IRStatusTable />
        </div>
    );
}

export default Status;
