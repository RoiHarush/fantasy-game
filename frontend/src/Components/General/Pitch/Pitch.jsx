import Style from "../../../Styles/Pitch.module.css";
import PlayerCard from "../PlayerCard";
import { getPlayerById } from "../../../Utils/ItemGetters";
import { usePlayers } from "../../../Context/PlayersContext";

function Pitch({
    squad,
    view,
    currentGw,
    playerData
}) {
    const { players } = usePlayers();

    const renderPlayer = (id, index) => {
        const player = id ? getPlayerById(players, id) : null;

        let points = null;
        let nextFixture = null;

        if (player) {
            const playerDynamic = playerData?.find(p => Number(p.playerId) === Number(id));
            points = playerDynamic?.points ?? null;
            nextFixture = playerDynamic?.nextFixture ?? null;
        }

        if (!player) {
            return (
                <PlayerCard
                    key={`empty-${index}`}
                    player={null}
                    view={view}
                    captain={false}
                    viceCaptain={false}
                    currentGw={currentGw}
                    points={null}
                    nextFixture={null}
                />
            );
        }

        return (
            <PlayerCard
                key={id}
                player={player}
                view={view}
                captain={squad.captainId === id}
                viceCaptain={squad.viceCaptainId === id}
                currentGw={currentGw}
                points={points}
                nextFixture={nextFixture}
            />
        );
    };

    return (
        <div className={Style.pitchFrame}>
            <div className={Style.pitch}>
                {["GK", "DEF", "MID", "FWD"].map(pos => (
                    <div key={pos} className={Style.row}>
                        {squad.startingLineup[pos]?.map(renderPlayer)}
                    </div>
                ))}

                <div className={Style.bench} style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    alignItems: "center",
                }}>

                    {["GK", "S1", "S2", "S3"].map((slot, index) => {
                        const playerId = squad.bench ? squad.bench[slot] : null;
                        const label = slot === "GK" ? "GK" : slot.replace("S", "");

                        return (
                            <div key={slot} className={Style["bench-slot"]}>
                                {renderPlayer(playerId, `bench-${index}`)}
                                <div className={Style["bench-label"]}>{label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Pitch;