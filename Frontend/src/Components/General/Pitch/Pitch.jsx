import Style from "../../../Styles/Pitch.module.css"
import PlayerCard from "../PlayerCard"
import { getPlayerById } from "../../../Utillites/ItemGetters"

function Pitch({ squad, view, selectedPlayerId, disabledIds, onClick }) {
    const isPickMode = view === "pick"

    const renderPlayer = (id) => (
        <PlayerCard
            key={id}
            player={getPlayerById(id)}
            view={view}
            isSelected={isPickMode && id === selectedPlayerId}
            isDisabled={isPickMode && disabledIds.includes(id)}
            onClick={onClick}
        />
    )

    return (
        <div className={Style.pitchFrame}>
            <div className={Style.pitch}>
                {["GK", "DEF", "MID", "FWD"].map((pos) => (
                    <div key={pos} className={Style.row}>
                        {squad.startingLineup[pos].map(renderPlayer)}
                    </div>
                ))}

                <div
                    className={Style.bench}
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${squad.bench.length}, 1fr)`,
                        justifyItems: "center",
                        alignItems: "center"
                    }}
                >
                    {squad.bench.map(renderPlayer)}
                </div>
            </div>
        </div>
    )
}

export default Pitch

