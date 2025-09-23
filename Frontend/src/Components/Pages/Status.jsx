import ColumnsBlock from "../Blocks/ColumnsBlock";
import SplitBlock from "../Blocks/SplitBlock";
import Style from "../../Styles/Status.module.css";

function Status({ user, currentGameweek, nextGameweek, leagueName }) {
    const draftRoomOpens = new Date(
        new Date(nextGameweek.firstKickoffTime).getTime() - 70 * 60000
    );
    const gameweekStart = new Date(nextGameweek.firstKickoffTime);

    return (
        <div className={Style.statusPage}>
            <h3>Current Team - {user.fantasyTeam}</h3>
            <ColumnsBlock title={currentGameweek.name} columns={2}>
                <div>
                    <p>{currentGameweek.name} points</p>
                    <h2 className={Style.gradientText}>{user.points}</h2>
                </div>
                <div>
                    <p>{leagueName}</p>
                    <h2 className={Style.gradientText}>{user.rank}rd</h2>
                </div>
            </ColumnsBlock>

            <h3>Upcoming deadlines</h3>
            <SplitBlock
                items={[
                    {
                        title: "Draft Room",
                        content: (
                            <p>
                                {draftRoomOpens.toLocaleDateString("en-GB", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}{" "}
                                {draftRoomOpens.toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                    timeZone: "Asia/Jerusalem"
                                })}
                            </p>

                        ),
                    },
                    {
                        title: "Pick Team Open",
                        content: (
                            <p>
                                {gameweekStart.toLocaleDateString("en-GB", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}{" "}
                                {gameweekStart.toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                    timeZone: "Asia/Jerusalem"
                                })}
                            </p>

                        ),
                    },
                ]}
            />
        </div>
    );
}

export default Status;
