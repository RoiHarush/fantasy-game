import FixturesTable from "./FixturesTable";
import Style from "../../../Styles/Fixtures.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";

function Fixtures() {
    const { gameweeks, nextGameweek } = useGameweek();

    if (!gameweeks || gameweeks.length === 0) {
        return <div>Loading fixtures...</div>;
    }

    return (
        <div className={Style.fixturesScreen}>
            <h3 className={Style.title}>Fixtures</h3>
            <div className={Style.FixturesTable}>
                <FixturesTable
                    gameweeks={gameweeks}
                    defaultGameweek={nextGameweek}
                />
            </div>
        </div>
    );
}

export default Fixtures;
