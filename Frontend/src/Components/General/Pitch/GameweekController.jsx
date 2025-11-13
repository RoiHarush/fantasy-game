import style from "../../../Styles/GameweekController.module.css";

function GameweekController({ onPrev, onNext, hidePrev, gw }) {
    return (
        <div className={style.pointsControlsInside}>
            <button
                onClick={onPrev}
                className={style.pointsButtonInside}
                style={{ visibility: hidePrev ? "hidden" : "visible" }}
            >
                ← Previous
            </button>
            <div className={style.pointsGameweekInfoInside}>
                Gameweek {gw}
            </div>
            <button
                onClick={onNext}
                className={style.pointsButtonInside}
            >
                Next →
            </button>
        </div>
    );
}

export default GameweekController;
