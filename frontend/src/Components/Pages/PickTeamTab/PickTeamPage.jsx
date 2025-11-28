import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchUserChips, saveTeamRequest } from "../../../services/pickTeamService";
import { fetchPlayerDataForGameweek, fetchSquadForGameweek } from "../../../services/squadService";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import PickTeam from "./PickTeam";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";

function PickTeamPage() {
    const { user } = useAuth();
    const { nextGameweek, gameweeks } = useGameweek();

    const [squad, setSquad] = useState(null);
    const [chips, setChips] = useState({ remaining: {}, active: {} });
    const [playerData, setPlayerData] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || !nextGameweek) return;

        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const [squadRes, chipsRes, playerDataRes] = await Promise.all([
                    fetchSquadForGameweek(user.id, nextGameweek.id),
                    fetchUserChips(user.id),
                    fetchPlayerDataForGameweek(user.id, nextGameweek.id)
                ]);

                if (!cancelled) {
                    setSquad(squadRes);
                    setChips(chipsRes);
                    setPlayerData(playerDataRes);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => (cancelled = true);
    }, [user, nextGameweek]);

    async function saveTeam() {
        if (!squad) return false;

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
            const updatedSquad = await saveTeamRequest(user.id, dto);
            setSquad(updatedSquad);
            setIsDirty(false);
            return true;
        } catch (err) {
            console.error("Failed to save team:", err);
            return false;
        }
    }

    if (loading || !nextGameweek) {
        return <LoadingPage />;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <PageLayout
            left={
                <PickTeam
                    user={user}
                    nextGameweek={nextGameweek}
                    gameweeks={gameweeks}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    playerData={playerData}
                    saveTeam={saveTeam}
                    isDirty={isDirty}
                    setIsDirty={setIsDirty}
                />
            }
            right={<UserSidebar user={user} />}
        />
    );
}

export default PickTeamPage;
