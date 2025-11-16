import ColumnsBlock from "../../Blocks/ColumnsBlock";
import SplitBlock from "../../Blocks/SplitBlock";
import Style from "../../../Styles/Status.module.css";
import IRStatusTable from "./IRStatusTable";
import PlayerOfTheWeekBlock from "./PlayerOfTheWeekBlock";

function Status({ user, league, currentGameweek, nextGameweek }) {
    const transferOpens = new Date(nextGameweek.transferOpenTime);
    const gwStart = new Date(nextGameweek.firstKickoffTime);

    const leagueUser = league.users?.find(u => u.id === user.id);
    const gwPoints = user.pointsByGameweek?.[currentGameweek.id] ?? "-";

    return (
        <div className={Style.statusPage}>
            <h3>Current Team - {user.fantasyTeam}</h3>

            <ColumnsBlock title={currentGameweek.name} columns={2}>
                <div>
                    <p>{currentGameweek.name} points</p>
                    <h2 className={Style.gradientText}>{gwPoints}</h2>
                </div>

                <div>
                    <p>{league.name}</p>
                    <h2 className={Style.gradientText}>
                        {leagueUser?.rank ?? "-"}{getRankSuffix(leagueUser?.rank)}
                    </h2>
                </div>
            </ColumnsBlock>

            <h3>Upcoming deadlines</h3>

            <SplitBlock
                items={[
                    {
                        title: "Transfer Window",
                        content: formatDateTime(transferOpens),
                    },
                    {
                        title: "Lineup Lock",
                        content: formatDateTime(gwStart),
                    },
                ]}
            />

            <PlayerOfTheWeekBlock />
            <IRStatusTable />
        </div>
    );
}

function formatDateTime(date) {
    return (
        <p>
            {date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            })}{" "}
            {date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Jerusalem",
            })}
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
