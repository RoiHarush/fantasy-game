import { useState, useEffect } from "react";
import Style from "../../../Styles/DraftHeader.module.css";

function DraftHeader({ leagueName, currentTurnUser, user, turnDuration, onTurnEnd }) {
    const [timeLeft, setTimeLeft] = useState(turnDuration);

    useEffect(() => {
        setTimeLeft(turnDuration);
    }, [currentTurnUser, turnDuration]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTurnEnd();
            return;
        }
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, onTurnEnd]);

    const progressPercent = (timeLeft / turnDuration) * 100;
    const isMyTurn = user && currentTurnUser && user.id === currentTurnUser.id;

    return (
        <div className={Style.draftHeader}>
            <div className={Style.leagueTitle}>{leagueName}</div>

            <div className={Style.timer}>
                Time left: {timeLeft}s
            </div>

            <div className={Style.progressBarWrapper}>
                <div
                    className={Style.progressBar}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className={Style.turnInfo}>
                {currentTurnUser
                    ? (isMyTurn ? "Your turn!" : `${currentTurnUser.name}'s turn`)
                    : "Waiting..."}
            </div>
        </div>
    );

}

export default DraftHeader;
