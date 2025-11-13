import { useEffect, useState } from "react";
import ColumnsBlock from "../../Blocks/ColumnsBlock";
import SplitBlock from "../../Blocks/SplitBlock";
import Style from "../../../Styles/Status.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";
import API_URL from "../../../config";
import IRStatusTable from "./IRStatusTable";
import PlayerOfTheWeekBlock from "./PlayerOfTheWeekBlock";

function Status({ user }) {
    const { currentGameweek, nextGameweek } = useGameweek();
    const [league, setLeague] = useState(null);

    useEffect(() => {
        if (currentGameweek) {
            fetch(`${API_URL}/api/league?gw=${currentGameweek.id}`)
                .then(res => res.json())
                .then(data => setLeague(data))
                .catch(err => console.error("Failed to fetch league:", err));
        }
    }, [currentGameweek]);

    if (!currentGameweek || !nextGameweek || !league) {
        return <div>Loading status...</div>;
    }

    const tranferWindowOpens = new Date(nextGameweek.transferOpenTime);
    const gameweekStart = new Date(nextGameweek.firstKickoffTime);

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
                        content: formatDateTime(tranferWindowOpens),
                    },
                    {
                        title: "Lineup Lock",
                        content: formatDateTime(gameweekStart),
                    },
                ]}
            />

            {/* <PlayerOfTheWeekBlock /> */}

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
