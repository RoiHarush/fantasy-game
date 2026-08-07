"use client";
import FixturesTable from "../FixturesTab/FixturesTable";
import Style from "../../../Styles/Points.module.css";
import PointsBlock from "../../Blocks/PointsBlock";
import { usePlayers } from "../../../features/players/usePlayers";
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
    const selectedIndex = gameweeks.findIndex(gw => gw.id === selectedGameweek.id);
    const latestVisibleIndex = gameweeks.findIndex(gw => gw.id === currentGameweek?.id);

    const handlePrev = () => {
        if (selectedIndex > 0) setSelectedGameweek(gameweeks[selectedIndex - 1]);
    };

    const handleNext = () => {
        const nextGw = gameweeks[selectedIndex + 1];
        if (nextGw && selectedIndex < latestVisibleIndex) setSelectedGameweek(nextGw);
    };

    return (
        <div className={Style.pointsScreen}>
            <h3 className={Style.title}>
                {selectedGameweek.name} – {user.fantasyTeamName}
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
                                    hidePrev={selectedIndex <= 0}
                                    hideNext={selectedIndex < 0 || selectedIndex >= latestVisibleIndex}
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
