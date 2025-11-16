import Style from "../../Styles/Block.module.css";

function PointsBlock({ points }) {
    return (
        <div className={`${Style.pointsBlock}`}>
            <div className={`${Style.pointsBlockHeader}`}>{"Points"}</div>
            <div className={Style.pointsBlockValue}>{points}</div>
        </div>
    );
}

export default PointsBlock