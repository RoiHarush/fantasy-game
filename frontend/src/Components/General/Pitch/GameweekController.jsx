import style from "../../../Styles/GameweekController.module.css";

function GameweekController({ onPrev, onNext, canGoPrevious, canGoNext, gw }) {
    return (
        <div className={style.pointsControlsInside}>
            {canGoPrevious ? (
                <button type="button" onClick={onPrev} className={style.pointsButtonInside}>
                    ← Previous
                </button>
            ) : <span aria-hidden="true" />}
            <div className={style.pointsGameweekInfoInside}>
                Gameweek {gw}
            </div>
            {canGoNext ? (
                <button type="button" onClick={onNext} className={style.pointsButtonInside}>
                    Next →
                </button>
            ) : <span aria-hidden="true" />}
        </div>
    );
}

export default GameweekController;
