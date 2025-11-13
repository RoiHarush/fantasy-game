import { useNavigate } from "react-router-dom";
import Style from "../../../Styles/ClosedWindow.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";

function ClosedWindow() {
    const { nextGameweek, gameweeks } = useGameweek();
    const navigate = useNavigate();

    const tranferWindowOpens = new Date(nextGameweek.transferOpenTime);

    return (
        <div className={Style.closedWindow}>
            <h2 className={Style.title}>Transfer Window</h2>
            <p className={Style.message}>The transfer window is currently closed.</p>
            <p className={Style.message}>The window will open in:</p>
            <span>{formatDateTime(tranferWindowOpens)}</span>
            <button
                className={Style.scoutButton}
                onClick={() => navigate("/scout")}
            >
                Go to Scout and build your Watchlist
            </button>
        </div>
    );
}

function formatDateTime(date) {
    return (
        <p>
            {date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            })}{" "}
            {date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Jerusalem",
            })}
        </p>
    );
}

export default ClosedWindow;