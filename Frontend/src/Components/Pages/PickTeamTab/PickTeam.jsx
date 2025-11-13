import Style from "../../../Styles/PickTeam.module.css";
import { useEffect, useState } from "react";
import FixturesTable from "../FixturesTab/FixturesTable";
import PickTeamBlock from "../../Blocks/PickTeamBlock";
import { useGameweek } from "../../../Context/GameweeksContext";
import { usePlayers } from "../../../Context/PlayersContext";
import API_URL from "../../../config";
import IRManager from "./IR/IRManager";
import FirstPickManager from "./FirstPickCaptain/FirstPickManager";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";

function PickTeam({ user }) {
    const { nextGameweek, gameweeks } = useGameweek();
    const { players } = usePlayers();
    const [squad, setSquad] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [playerData, setPlayerData] = useState([]);
    const [chips, setChips] = useState({ remaining: {}, active: {} });

    useEffect(() => {
        if (nextGameweek && user) {
            fetch(`${API_URL}/api/users/${user.id}/squad?gw=${nextGameweek.id}`)
                .then(res => res.json())
                .then(data => setSquad(data))
                .catch(err => console.error("Failed to fetch squad:", err));
        }
    }, [nextGameweek, user]);

    useEffect(() => {
        if (user) {
            fetch(`${API_URL}/api/chips/user/${user.id}`)
                .then(res => res.json())
                .then(data => setChips(data))
                .catch(err => console.error("Failed to fetch chips:", err));
        }
    }, [user]);

    useEffect(() => {
        if (user && nextGameweek) {
            const fetchData = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/players/user/${user.id}/gameweek/${nextGameweek.id}`);
                    if (!res.ok) throw new Error("Failed to fetch player data");
                    const data = await res.json();
                    setPlayerData(data);
                } catch (err) {
                    console.error("❌ Error fetching player data:", err);
                    setPlayerData([]);
                }
            };

            fetchData();
        }
    }, [user, nextGameweek]);


    const saveTeam = async () => {
        if (!user || !squad) return;

        const dto = {
            startingLineup: squad.startingLineup,
            bench: squad.bench,
            formation: {
                GK: squad.startingLineup.GK?.length || 0,
                DEF: squad.startingLineup.DEF?.length || 0,
                MID: squad.startingLineup.MID?.length || 0,
                FWD: squad.startingLineup.FWD?.length || 0
            },
            captainId: squad.captainId || null,
            viceCaptainId: squad.viceCaptainId || null,
            irId: squad.irId || null,
            firstPickId: squad.firstPickId || null
        };

        try {
            const res = await fetch(`${API_URL}/api/pick?userId=${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto)
            });

            if (!res.ok) {
                const errorMsg = await res.text();
                alert("❌ Failed to save team:\n" + errorMsg);
                return;
            }

            const updatedSquad = await res.json();
            setSquad(updatedSquad);
            setIsDirty(false);
            alert("✅ Team saved successfully!");
        } catch (err) {
            console.error("Error saving team:", err);
            alert("❌ Unexpected error while saving team. Check console for details.");
        }
    };

    if (!nextGameweek || !squad) {
        return <div>Loading gameweek...</div>;
    }

    return (
        <div className={Style.pickTeamScreen}>
            <h3 className={Style.title}>My Team – {nextGameweek.name}</h3>

            <div className={Style.chipBar}>
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
                                    date={`${nextGameweek.name}: ${new Date(
                                        nextGameweek.firstKickoffTime
                                    ).toLocaleString("en-GB", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}`}
                                />
                            }
                        />
                    </PlayerInteractionProvider>
                </div>

                <div className={Style.saveContainer}>
                    <button
                        className={`${Style.btn} ${Style.saveTeam}`}
                        onClick={saveTeam}
                        disabled={!isDirty}
                    >
                        Save Team
                    </button>
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
