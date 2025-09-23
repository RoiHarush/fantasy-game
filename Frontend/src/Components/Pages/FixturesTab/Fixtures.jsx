import FixturesTable from "./FixturesTable";
import Style from "../../../Styles/Fixtures.module.css";

function Fixtures({ gameweeks, defaultGameweek }) {
    return (
        <div className={Style.fixturesScreen}>
            <h3 className={Style.title}>Fixtures</h3>
            <div className={Style.FixturesTable}>
                <FixturesTable gameweeks={gameweeks} defaultGameweek={defaultGameweek} />
            </div>
        </div>
    );
}

export default Fixtures;
