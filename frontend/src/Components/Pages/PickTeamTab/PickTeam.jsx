import Style from "../../../Styles/PickTeam.module.css";
import FixturesTable from "../FixturesTab/FixturesTable";
import PickTeamBlock from "../../Blocks/PickTeamBlock";
import { usePlayers } from "../../../features/players/usePlayers";
import IRManager from "./IR/IRManager";
import FirstPickManager from "./FirstPickCaptain/FirstPickManager";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";

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
    savePending,
    saveSucceeded,
    saveError,
    isDirty,
    setIsDirty,
    refreshPlayerData
}) {
    const playersQuery = usePlayers();
    const { players } = playersQuery;

    const handleSave = async () => {
        await saveTeam().catch(() => undefined);
    };

    if (playersQuery.isPending) return <p role="status">Loading player data…</p>;
    if (playersQuery.error) return <p role="alert">Player data is temporarily unavailable.</p>;

    return (
        <div className={Style.pickTeamScreen}>
            <h3 className={Style.title}>My Team – {nextGameweek.name}</h3>

            <div className={Style.chipBar}>
                <IRManager
                    userId={user.id}
                    gameweekId={nextGameweek.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    transferWindowProcessed={nextGameweek.transferWindowProcessed}
                    refreshPlayerData={refreshPlayerData}
                    players={players}
                />

                <FirstPickManager
                    userId={user.id}
                    gameweekId={nextGameweek.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    players={players}
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
                            players={players}
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
                        type="button"
                        className={`${Style.btn} ${Style.saveTeam}`}
                        onClick={handleSave}
                        disabled={!isDirty || savePending}
                    >
                        {savePending ? "Saving…" : "Save Team"}
                    </button>

                    {!isDirty && saveSucceeded && (
                        <div className={Style.savedMessage} role="status">
                            Your team has been saved
                        </div>
                    )}
                    {saveError && <p role="alert">{saveError.message || "Your team could not be saved."}</p>}

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
