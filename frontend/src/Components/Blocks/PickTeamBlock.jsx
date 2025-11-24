import React from 'react';
import Style from "../../Styles/Block.module.css";

function PickTeamBlock({ gameweek, kickoffTime }) {

    const parseDateArray = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        return new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]);
    };

    const formatDateTime = (dateArray) => {
        const date = parseDateArray(dateArray);
        if (!date) return "TBA";

        const dateStr = date.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
        }).replace(/,/g, '');

        const timeStr = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jerusalem",
        });

        return `${dateStr} ${timeStr}`;
    };

    return (
        <div className={`${Style.pickTeamBlock}`}>
            <div className={`${Style.pickTeamBlockHeader}`}>{`Gameweek ${gameweek}`}</div>
            <div className={Style.pickTeamBlockValue}>
                {formatDateTime(kickoffTime)}
            </div>
        </div>
    );
}

export default PickTeamBlock;