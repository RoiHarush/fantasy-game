import { useState } from "react";
import FixturesTable from "./FixturesTab/FixturesTable";
import Style from "../../Styles/Points.module.css"
import PitchWrapper from "../General/Pitch/PitchWrapper";
import PointsBlock from "../Blocks/PointsBlock";

function Points({ user, gameweek, gameweeks }) {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

    return (
        <div className={Style.pointsScreen}>
            <h3 className={Style.title}>
                {gameweek.name} - {user.fantasyTeam}
            </h3>
            <div className={Style.contentWrapper}>
                <div className={Style.pitchWrapper}>
                    <PitchWrapper
                        squad={user.squad}
                        view="points"
                        selectedPlayerId={selectedPlayerId}
                        disabledIds={[]}
                        onClick={() => { }}
                        block={<PointsBlock points={user.points} />}
                    />
                </div>

                <div className={Style.fixtures}>
                    <FixturesTable gameweeks={gameweeks} defaultGameweek={gameweek} />
                </div>
            </div>
        </div>
    );
}


export default Points