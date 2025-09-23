import Style from "../../Styles/PickTeam.module.css";
import { useState } from "react";
import players from "../../MockData/Players";
import { getAllowedSwapIds, swapPlayersInSquad } from "../../Utillites/PickTeamUtillites";
import FixturesTable from "./FixturesTab/FixturesTable";
import PitchWrapper from "../General/Pitch/PitchWrapper";
import PickTeamBlock from "../Blocks/PickTeamBlock";

function PickTeam({ user, gameweek, gameweeks }) {
    const [squad, setSquad] = useState(user.squad);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [disabledIds, setDisabledIds] = useState([]);
    const [isDirty, setIsDirty] = useState(false);

    const handlePlayerClick = (playerId) => {
        if (!selectedPlayerId) {
            setSelectedPlayerId(playerId);

            const allowed = getAllowedSwapIds(squad, playerId, players);
            const disabled = players
                .map((p) => p.id)
                .filter((id) => !allowed.includes(id) && id !== playerId);
            setDisabledIds(disabled);
        } else if (selectedPlayerId === playerId) {
            setSelectedPlayerId(null);
            setDisabledIds([]);
        } else {
            const newSquad = swapPlayersInSquad(squad, selectedPlayerId, playerId);
            setSquad(newSquad);
            setIsDirty(true);
            setSelectedPlayerId(null);
            setDisabledIds([]);
        }
    };

    const saveTeam = () => {
        console.log("Sending to Server:", squad);
        alert("Successfully Saved!");
        setIsDirty(false);
    };

    return (
        <div className={Style.pickTeamScreen}>
            <h3 className={Style.title}>My Team – {gameweek.name}</h3>

            <div className={Style.contentWrapper}>
                <div className={Style.pitchWrapper}>
                    <PitchWrapper
                        squad={squad}
                        view="pick"
                        selectedPlayerId={selectedPlayerId}
                        disabledIds={disabledIds}
                        onClick={handlePlayerClick}
                        block={
                            <PickTeamBlock
                                gameweek={gameweek.id}
                                date={`${gameweek.name}: ${new Date(
                                    gameweek.firstKickoffTime
                                ).toLocaleString()}`}
                            />
                        }
                    />
                </div>

                {isDirty && (
                    <div className={Style.saveContainer}>
                        <button
                            className={`${Style.btn} ${Style.saveTeam}`}
                            onClick={saveTeam}
                        >
                            Save Team
                        </button>
                    </div>
                )}

                <div className={Style.fixtures}>
                    <FixturesTable gameweeks={gameweeks} defaultGameweek={gameweek} />
                </div>
            </div>
        </div>
    );
}

export default PickTeam;
