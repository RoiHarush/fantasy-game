"use client";

import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";
import { usePlayers } from "../../../features/players/usePlayers";
import PointsBlock from "../../Blocks/PointsBlock";
import GameweekController from "../../General/Pitch/GameweekController";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import FixturesTable from "../FixturesTab/FixturesTable";

function Points({
    user,
    squad,
    points,
    playerData,
    gameweekView,
    allGameweeks,
    onSelectGameweek,
    previewPlayers = null,
    previewFixtures = null,
}) {
    const playersQuery = usePlayers();
    const players = previewPlayers ?? playersQuery.players;
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

    if (!previewPlayers && playersQuery.isPending) return <p role="status">Loading player data…</p>;
    if (!previewPlayers && playersQuery.error) return <p role="alert">Player data is temporarily unavailable.</p>;

    return (
        <div className="flex min-w-0 flex-col gap-5">
            <h3 className="mb-1 text-center text-xl font-bold text-app-foreground md:mb-5 md:text-left md:text-[1.6rem]">
                {selectedGameweek.name} – {user.fantasyTeamName}
            </h3>

            <div className="flex w-full max-w-[62.5rem] flex-col gap-5">
                <div className="w-full">
                    <PlayerInteractionProvider mode="points" players={players} gameweek={selectedGameweek} user={user}>
                        <PitchWrapperBase
                            squad={squad}
                            view="points"
                            currentGw={selectedGameweek}
                            playerData={playerData}
                            players={players}
                            block={<PointsBlock points={points} />}
                            gwControl={(
                                <GameweekController
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    canGoPrevious={canGoPrevious}
                                    canGoNext={canGoNext}
                                    gw={selectedGameweek.id}
                                />
                            )}
                        />
                    </PlayerInteractionProvider>
                </div>

                <div className="w-full">
                    <FixturesTable gameweeks={allGameweeks} defaultGameweek={selectedGameweek} previewData={previewFixtures} />
                </div>
            </div>
        </div>
    );
}

export default Points;
