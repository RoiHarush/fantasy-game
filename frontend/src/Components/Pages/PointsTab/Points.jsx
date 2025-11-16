import { useNavigate } from "react-router-dom";
import FixturesTable from "../FixturesTab/FixturesTable";
import Style from "../../../Styles/Points.module.css";
import PointsBlock from "../../Blocks/PointsBlock";
import { usePlayers } from "../../../Context/PlayersContext";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import GameweekController from "../../General/Pitch/GameweekController";
import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";

function Points({
    user,
    squad,
    points,
    playerData,
    selectedGameweek,
    setSelectedGameweek,
    gameweeks,
    currentGameweek
}) {
    const { players } = usePlayers();
    const navigate = useNavigate();

    const handlePrev = () => {
        const idx = gameweeks.findIndex(gw => gw.id === selectedGameweek.id);
        if (idx > 0) setSelectedGameweek(gameweeks[idx - 1]);
    };

    const handleNext = () => {
        const idx = gameweeks.findIndex(gw => gw.id === selectedGameweek.id);
        const nextGw = gameweeks[idx + 1];
        if (!nextGw || nextGw.id > currentGameweek.id) {
            navigate("/pick-team");
        } else {
            setSelectedGameweek(nextGw);
        }
    };

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
                            block={<PointsBlock points={points} />}
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
                    <FixturesTable
                        gameweeks={gameweeks}
                        defaultGameweek={selectedGameweek}
                    />
                </div>
            </div>
        </div>
    );
}

export default Points;