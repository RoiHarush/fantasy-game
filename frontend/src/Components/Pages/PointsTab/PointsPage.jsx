import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchUserLivePoints, fetchUserPoints } from "../../../services/pointsService";
import { fetchPlayerDataForGameweek, fetchSquadForGameweek } from "../../../services/squadService";
import PageLayout from "../../PageLayout";
import Link from "next/link";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";


function PointsPage({ displayedUser }) {
    const { user: loggedUser } = useAuth();
    const { currentGameweek, nextGameweek, gameweeks, lastGameweek } = useGameweek();

    const targetUser = displayedUser || loggedUser;

    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const [squad, setSquad] = useState(null);
    const [points, setPoints] = useState(null);
    const [playerData, setPlayerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isPreSeason = !lastGameweek && !currentGameweek && nextGameweek?.status === "UPCOMING";

    useEffect(() => {
        if (currentGameweek) setSelectedGameweek(currentGameweek);
    }, [currentGameweek]);

    useEffect(() => {
        if (!targetUser || !selectedGameweek) return;
        if (isPreSeason) {
            setLoading(false);
            setSquad(null);
            setPoints(null);
            setPlayerData([]);
            return;
        }

        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const isLiveGameweek = currentGameweek && selectedGameweek.id === currentGameweek.id;

                const pointsPromise = isLiveGameweek
                    ? fetchUserLivePoints(targetUser.id, selectedGameweek.id)
                    : fetchUserPoints(targetUser.id, selectedGameweek.id);

                const [squadRes, pointsRes, playerDataRes] = await Promise.all([
                    fetchSquadForGameweek(targetUser.id, selectedGameweek.id),
                    pointsPromise,
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
    }, [targetUser, selectedGameweek, currentGameweek, isPreSeason]);

    if (isPreSeason) {
        return (
            <section style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
                <h1>The season has not started yet</h1>
                <p>There are no gameweek points to display.</p>
                <Link href="/pick-team">Prepare your Gameweek 1 squad</Link>
            </section>
        );
    }

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
