import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchUserPoints } from "../../../services/pointsService";
import { fetchPlayerDataForGameweek, fetchSquadForGameweek } from "../../../services/squadService";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";
import LoadingPage from "../../General/LoadingPage";


function PointsPage({ user }) {
    const { currentGameweek, gameweeks } = useGameweek();

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
        if (!user || !selectedGameweek) return;

        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [squadRes, pointsRes, playerDataRes] = await Promise.all([
                    fetchSquadForGameweek(user.id, selectedGameweek.id),
                    fetchUserPoints(user.id, selectedGameweek.id),
                    fetchPlayerDataForGameweek(user.id, selectedGameweek.id)
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
    }, [user, selectedGameweek]);

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
                    user={user}
                    squad={squad}
                    points={points}
                    playerData={playerData}
                    selectedGameweek={selectedGameweek}
                    setSelectedGameweek={setSelectedGameweek}
                    gameweeks={gameweeks}
                    currentGameweek={currentGameweek}
                />
            }
            right={<UserSidebar user={user} />}
        />
    );
}

export default PointsPage;

