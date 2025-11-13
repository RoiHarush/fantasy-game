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

    const renderPlayer = (id) => {
        if (!id) return null;

        const player = getPlayerById(players, id);
        if (!player) return null;

        const playerDynamic = playerData?.find(p => Number(p.playerId) === Number(id));
        const points = playerDynamic?.points ?? null;
        const nextFixture = playerDynamic?.nextFixture ?? null;

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
                    {["GK", "S1", "S2", "S3"].map(slot => {
                        const playerId = squad.bench ? squad.bench[slot] : null;
                        const label = slot === "GK" ? "GK" : slot.replace("S", "");

                        return (
                            <div key={slot} className={Style["bench-slot"]}>
                                {renderPlayer(playerId)}
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