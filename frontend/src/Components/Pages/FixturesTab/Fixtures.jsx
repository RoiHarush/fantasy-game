import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { getDefaultFixturesGameweek } from "../../../features/fixtures/model";
import styles from "../../../Styles/Fixtures.module.css";
import FixturesTable from "./FixturesTable";

function Fixtures() {
    const gameweekState = useGameweek();
    const defaultGameweek = getDefaultFixturesGameweek(gameweekState);

    if (gameweekState.loading) return <p role="status">Loading fixtures…</p>;
    if (gameweekState.error) return <p role="alert">Unable to load gameweeks: {gameweekState.error}</p>;
    if (gameweekState.gameweeks.length === 0) return <p role="status">No fixture schedule is available.</p>;

    return (
        <div className={styles.fixturesScreen}>
            <h3 className={styles.title}>Fixtures</h3>
            <div className={styles.FixturesTable}>
                <FixturesTable
                    gameweeks={gameweekState.gameweeks}
                    defaultGameweek={defaultGameweek}
                />
            </div>
        </div>
    );
}

export default Fixtures;
