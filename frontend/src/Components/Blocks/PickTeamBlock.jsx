import Style from "../../Styles/Block.module.css";

function PickTeamBlock({ gameweek, date }) {
    return (
        <div className={`${Style.pickTeamBlock}`}>
            <div className={`${Style.pickTeamBlockHeader}`}>{`Gameweek ${gameweek}`}</div>
            <div className={Style.pickTeamBlockValue}>{date}</div>
        </div>
    );
}

export default PickTeamBlock