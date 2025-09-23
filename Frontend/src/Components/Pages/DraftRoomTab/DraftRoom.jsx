import { useState } from "react";
import DraftRoomWrapper from "./DraftRoomWrapper";
import DraftHeader from "./DraftHeader";
import Style from "../../../Styles/DraftRoom.module.css";

function DraftRoom({ players, initialUser, leagueName = "My Fantasy League" }) {
    const [user, setUser] = useState(initialUser);

    const [currentTurnUser, setCurrentTurnUser] = useState(initialUser);

    const turnDuration = 90;

    // מה קורה כשנגמר הזמן (תעביר תור, תעדכן state או API)
    const handleTurnEnd = () => {
        console.log("Turn ended!");
        // כאן תכניס לוגיקה שתעביר תור הלאה
    };

    return (
        <div className={Style.draftRoom}>
            <DraftHeader
                leagueName={leagueName}
                currentTurnUser={currentTurnUser}
                user={user}
                turnDuration={turnDuration}
                onTurnEnd={handleTurnEnd}
            />

            <DraftRoomWrapper players={players} user={user} setUser={setUser} />
        </div>
    );
}

export default DraftRoom;
