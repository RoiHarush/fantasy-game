import Style from "../../../Styles/PickTeam.module.css";
import FixturesTable from "../FixturesTab/FixturesTable";
import PickTeamBlock from "../../Blocks/PickTeamBlock";
import { usePlayers } from "../../../Context/PlayersContext";
import IRManager from "./IR/IRManager";
import FirstPickManager from "./FirstPickCaptain/FirstPickManager";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";
import { useState } from "react";

function PickTeam({
    user,
    nextGameweek,
    gameweeks,
    squad,
    setSquad,
    chips,
    setChips,
    playerData,
    saveTeam,
    isDirty,
    setIsDirty,
}) {
    const { players } = usePlayers();
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    const handleSave = async () => {
        const success = await saveTeam();

        if (success) {
            setShowSavedMessage(true);
            // setTimeout(() => setShowSavedMessage(false), 3000);
        }
    };


    return (
        <div className={Style.pickTeamScreen}>
            <h3 className={Style.title}>My Team – {nextGameweek.name}</h3>

            <div className={Style.chipBar}>
                <IRManager
                    userId={user.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                />

                <FirstPickManager
                    userId={user.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                />
            </div>

            <div className={Style.contentWrapper}>
                <div className={Style.pitchWrapper}>
                    <PlayerInteractionProvider
                        mode="pick"
                        squad={squad}
                        setSquad={setSquad}
                        setIsDirty={setIsDirty}
                        players={players}
                        chips={chips}
                        user={user}
                    >
                        <PitchWrapperBase
                            squad={squad}
                            view="pick"
                            currentGw={nextGameweek.id}
                            playerData={playerData}
                            block={
                                <PickTeamBlock
                                    gameweek={nextGameweek.id}
                                    kickoffTime={nextGameweek.firstKickoffTime}
                                />
                            }
                        />
                    </PlayerInteractionProvider>
                </div>

                <div className={Style.saveContainer}>
                    <button
                        className={`${Style.btn} ${Style.saveTeam}`}
                        onClick={handleSave}
                        disabled={!isDirty}
                    >
                        Save Team
                    </button>

                    {showSavedMessage && (
                        <div className={Style.savedMessage}>
                            Your team has been saved
                        </div>
                    )}

                </div>

                <div className={Style.fixtures}>
                    <FixturesTable
                        gameweeks={gameweeks}
                        defaultGameweek={nextGameweek}
                    />
                </div>
            </div>
        </div>
    );
}

export default PickTeam;
