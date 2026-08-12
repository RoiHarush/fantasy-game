import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { getDefaultFixturesGameweek } from "../../../features/fixtures/model";
import FixturesTable from "./FixturesTable";

function Fixtures() {
    const gameweekState = useGameweek();
    const defaultGameweek = getDefaultFixturesGameweek(gameweekState);

    if (gameweekState.loading) return <p role="status">Loading fixtures…</p>;
    if (gameweekState.error) return <p role="alert">Unable to load gameweeks: {gameweekState.error}</p>;
    if (gameweekState.gameweeks.length === 0) return <p role="status">No fixture schedule is available.</p>;

    return (
        <div className="flex min-w-0 flex-col gap-5">
            <h3 className="mb-1 text-center text-[1.3rem] font-bold text-app-foreground md:mb-5 md:text-left md:text-[1.6rem]">Fixtures</h3>
            <div className="w-full min-w-0">
                <FixturesTable
                    gameweeks={gameweekState.gameweeks}
                    defaultGameweek={defaultGameweek}
                />
            </div>
        </div>
    );
}

export default Fixtures;
