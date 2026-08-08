"use client";

import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";
import { usePlayers } from "../../../features/players/usePlayers";
import styles from "../../../Styles/Points.module.css";
import PointsBlock from "../../Blocks/PointsBlock";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import GameweekController from "../../General/Pitch/GameweekController";
import FixturesTable from "../FixturesTab/FixturesTable";

function Points({
    user,
    squad,
    points,
    playerData,
    gameweekView,
    allGameweeks,
    onSelectGameweek,
}) {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const {
        effectiveGameweek: selectedGameweek,
        visibleGameweeks,
        selectedIndex,
        canGoPrevious,
        canGoNext,
    } = gameweekView;

    const handlePrev = () => {
        if (canGoPrevious) onSelectGameweek(visibleGameweeks[selectedIndex - 1].id);
    };

    const handleNext = () => {
        if (canGoNext) onSelectGameweek(visibleGameweeks[selectedIndex + 1].id);
    };

    if (playersQuery.isPending) return <p role="status">Loading player data…</p>;
    if (playersQuery.error) return <p role="alert">Player data is temporarily unavailable.</p>;

    return (
        <div className={styles.pointsScreen}>
            <h3 className={styles.title}>
                {selectedGameweek.name} – {user.fantasyTeamName}
            </h3>

            <div className={styles.contentWrapper}>
                <div className={styles.pitchWrapper}>
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
                            players={players}
                            block={<PointsBlock points={points} />}
                            gwControl={
                                <GameweekController
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    canGoPrevious={canGoPrevious}
                                    canGoNext={canGoNext}
                                    gw={selectedGameweek.id}
                                />
                            }
                        />
                    </PlayerInteractionProvider>
                </div>

                <div className={styles.fixtures}>
                    <FixturesTable
                        gameweeks={allGameweeks}
                        defaultGameweek={selectedGameweek}
                    />
                </div>
            </div>
        </div>
    );
}

export default Points;
