import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchUserPoints } from "../../../services/pointsService";
import { fetchPlayerDataForGameweek, fetchSquadForGameweek } from "../../../services/squadService";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";


function PointsPage({ displayedUser }) {
    const { user: loggedUser } = useAuth();
    const { currentGameweek, gameweeks } = useGameweek();

    const targetUser = displayedUser || loggedUser;

    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const [squad, setSquad] = useState(null);
    const [points, setPoints] = useState(null);
    const [playerData, setPlayerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentGameweek) setSelectedGameweek(currentGameweek);
    }, [currentGameweek]);

    useEffect(() => {
        if (!targetUser || !selectedGameweek) return;

        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [squadRes, pointsRes, playerDataRes] = await Promise.all([
                    fetchSquadForGameweek(targetUser.id, selectedGameweek.id),
                    fetchUserPoints(targetUser.id, selectedGameweek.id),
                    fetchPlayerDataForGameweek(targetUser.id, selectedGameweek.id)
                ]);

                if (!cancelled) {
                    setSquad(squadRes);
                    setPoints(pointsRes);
                    setPlayerData(playerDataRes);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();

        return () => (cancelled = true);
    }, [targetUser, selectedGameweek]);

    if (loading || !selectedGameweek) {
        return <LoadingPage />;
    }

    if (error) {
        return <div>Error loading points: {error}</div>;
    }

    return (
        <PageLayout
            left={
                <Points
                    user={targetUser}
                    squad={squad}
                    points={points}
                    playerData={playerData}
                    selectedGameweek={selectedGameweek}
                    setSelectedGameweek={setSelectedGameweek}
                    gameweeks={gameweeks}
                    currentGameweek={currentGameweek}
                />
            }
            right={<UserSidebar user={targetUser} />}
        />
    );
}

export default PointsPage;
