import { formatAppDateTime } from "../../lib/dateTime";
import Style from "../../Styles/Block.module.css";

function PickTeamBlock({ gameweek, kickoffTime }) {
    return (
        <div className={`${Style.pickTeamBlock}`}>
            <div className={`${Style.pickTeamBlockHeader}`}>{`Gameweek ${gameweek}`}</div>
            <div className={Style.pickTeamBlockValue}>
                {formatAppDateTime(kickoffTime) ?? "TBA"}
            </div>
        </div>
    );
}

export default PickTeamBlock;
