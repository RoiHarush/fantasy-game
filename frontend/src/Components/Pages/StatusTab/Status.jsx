import { useQuery } from "@tanstack/react-query";
import ColumnsBlock from "../../Blocks/ColumnsBlock";
import SplitBlock from "../../Blocks/SplitBlock";
import Style from "../../../Styles/Status.module.css";
import IRStatusTable from "./IRStatusTable";
import PlayerOfTheWeekBlock from "./PlayerOfTheWeekBlock";
import { fetchUserPoints } from "../../../services/pointsService";
import { fetchDailyStatus } from "../../../services/gameweekService";
import DailyStatusTable from "./DailyStatusTable";
import TransferActivityList from "./TransferActivityList";
import { queryKeys } from "../../../lib/query/keys";

function Status({ user, league, currentGameweek, nextGameweek, preSeason = false }) {

    const pointsQuery = useQuery({
        queryKey: queryKeys.userGameweekPoints(user?.id, currentGameweek?.id),
        queryFn: () => fetchUserPoints(user.id, currentGameweek.id),
        enabled: Boolean(!preSeason && user?.id && currentGameweek?.id),
    });
    const dailyStatusQuery = useQuery({
        queryKey: queryKeys.dailyStatus(currentGameweek?.id),
        queryFn: () => fetchDailyStatus(currentGameweek.id),
        enabled: Boolean(!preSeason && currentGameweek?.id),
    });
    const gwPoints = pointsQuery.data ?? "-";
    const dailyStatus = dailyStatusQuery.data ?? [];

    const parseDateArray = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        return new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]);
    };

    const transferOpens = nextGameweek?.transferOpenTime ? parseDateArray(nextGameweek.transferOpenTime) : null;
    const gwStart = nextGameweek?.firstKickoffTime ? parseDateArray(nextGameweek.firstKickoffTime) : null;

    const leagueUser = league?.users?.find(u => u.id === user.id);
    const isCalculated = currentGameweek?.calculated === true;
    const transferHistoryGameweekId = currentGameweek?.status === "LIVE"
        ? currentGameweek.id
        : nextGameweek?.transferWindowProcessed
            ? nextGameweek.id
            : currentGameweek?.id;

    return (
        <div className={Style.statusPage}>
            <h1>Current Team - {user.fantasyTeamName}</h1>

            {preSeason ? (
                <ColumnsBlock title="Before Gameweek 1" columns={1}>
                    <div>
                        <p>Your initial squad is ready.</p>
                        <h2 className={Style.gradientText}>The season has not started yet</h2>
                    </div>
                </ColumnsBlock>
            ) : <ColumnsBlock title={currentGameweek?.name || "Gameweek"} columns={2}>
                <div>
                    <p>{currentGameweek?.name} points</p>
                    <h2 className={Style.gradientText}>{gwPoints}</h2>
                </div>

                <div>
                    <p>{league?.name}</p>
                    <h2 className={Style.gradientText}>
                        {leagueUser?.rank ?? "-"}{getRankSuffix(leagueUser?.rank)}
                    </h2>
                </div>
            </ColumnsBlock>}

            {dailyStatus.length > 0 && (
                <DailyStatusTable
                    dailyStatus={dailyStatus}
                    isGameweekFinished={isCalculated}
                />
            )}

            <h3>Upcoming deadlines</h3>

            <SplitBlock
                items={[
                    {
                        title: "Transfer Window",
                        content: transferOpens ? formatDateTime(transferOpens) : <p>TBA</p>,
                    },
                    {
                        title: "Lineup Lock",
                        content: gwStart ? formatDateTime(gwStart) : <p>TBA</p>,
                    },
                ]}
            />

            {!preSeason && <PlayerOfTheWeekBlock />}
            <TransferActivityList gameWeekId={transferHistoryGameweekId} />
            <IRStatusTable />
        </div>
    );
}

function formatDateTime(date) {
    if (!date) return null;

    const dateStr = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).replace(/,/g, '');

    const timeStr = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jerusalem",
    });

    return (
        <p>
            {dateStr} {timeStr}
        </p>
    );
}

function getRankSuffix(rank) {
    if (!rank) return "";
    if (rank % 10 === 1 && rank % 100 !== 11) return "st";
    if (rank % 10 === 2 && rank % 100 !== 12) return "nd";
    if (rank % 10 === 3 && rank % 100 !== 13) return "rd";
    return "th";
}

export default Status;
