import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FixturesTable from "../FixturesTab/FixturesTable";
import Style from "../../../Styles/Points.module.css";
import PointsBlock from "../../Blocks/PointsBlock";
import { useGameweek } from "../../../Context/GameweeksContext";
import PlayerMatchModal from "../../General/PlayerMatchModal";
import API_URL from "../../../config";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import { usePlayers } from "../../../Context/PlayersContext";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import GameweekController from "../../General/Pitch/GameweekController";
import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";

function Points({ user }) {
    const { currentGameweek, gameweeks } = useGameweek();
    const { players } = usePlayers();
    const [squad, setSquad] = useState(null);
    const [playerData, setPlayerData] = useState([]);
    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const [points, setPoints] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentGameweek) setSelectedGameweek(currentGameweek);
    }, [currentGameweek]);

    useEffect(() => {
        if (selectedGameweek && user) {
            fetch(`${API_URL}/api/users/${user.id}/squad?gw=${selectedGameweek.id}`)
                .then(res => res.json())
                .then(data => setSquad(data))
                .catch(err => console.error("Failed to fetch squad:", err));
        }
    }, [selectedGameweek, user]);

    useEffect(() => {
        if (selectedGameweek && user) {
            fetch(`${API_URL}/api/points/${user.id}/${selectedGameweek.id}`)
                .then(res => res.json())
                .then(data => setPoints(data))
                .catch(err => console.error("Failed to fetch player points:", err));
        }
    }, [selectedGameweek, user]);

    useEffect(() => {
        if (!user || !selectedGameweek) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/api/players/user/${user.id}/gameweek/${selectedGameweek.id}`);
                if (!res.ok) throw new Error("Failed to fetch player data");
                const data = await res.json();
                setPlayerData(data);
            } catch (err) {
                console.error("❌ Error fetching player data:", err);
                setPlayerData([]);
            }
        };

        fetchData();
    }, [user, selectedGameweek]);

    if (!selectedGameweek || !squad) return <div>Loading gameweek...</div>;

    const handlePrev = () => {
        const idx = gameweeks.findIndex(gw => gw.id === selectedGameweek.id);
        if (idx > 0) setSelectedGameweek(gameweeks[idx - 1]);
    };

    const handleNext = () => {
        const idx = gameweeks.findIndex(gw => gw.id === selectedGameweek.id);
        const nextGw = gameweeks[idx + 1];
        if (!nextGw || nextGw.id > currentGameweek.id) navigate("/pick-team");
        else setSelectedGameweek(nextGw);
    };

    const gwPoints = points;

    return (
        <div className={Style.pointsScreen}>
            <h3 className={Style.title}>
                {selectedGameweek.name} – {user.fantasyTeam}
            </h3>

            <div className={Style.contentWrapper}>
                <div className={Style.pitchWrapper}>
                    <PlayerInteractionProvider
                        mode="points"
                        players={players}
                        gameweek={selectedGameweek}
                        user={user}
                    >
                        <PitchWrapperBase
                            squad={squad}
                            view="points"
                            currentGw={selectedGameweek}
                            playerData={playerData}
                            block={<PointsBlock points={gwPoints} />}
                            gwControl={
                                <GameweekController
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    hidePrev={selectedGameweek.id === 1}
                                    gw={selectedGameweek.id}
                                />
                            }
                        />
                    </PlayerInteractionProvider>
                </div>

                <div className={Style.fixtures}>
                    <FixturesTable gameweeks={gameweeks} defaultGameweek={selectedGameweek} />
                </div>
            </div>
        </div>
    );
}

export default Points;
