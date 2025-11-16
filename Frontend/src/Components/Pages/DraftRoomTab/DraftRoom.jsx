import { useState } from "react";
import DraftRoomWrapper from "./DraftRoomWrapper";
import DraftHeader from "./DraftHeader";
import Style from "../../../Styles/DraftRoom.module.css";
import { usePlayers } from "../../../Context/PlayersContext";

function DraftRoom({ initialUser, leagueName = "My Fantasy League" }) {
    const [user, setUser] = useState(initialUser);
    const [currentTurnUser, setCurrentTurnUser] = useState(initialUser);
    const { players } = usePlayers();

    const turnDuration = 90;

    const handleTurnEnd = () => {
        console.log("Turn ended!");
    };

    if (!players || players.length === 0) {
        return <div>Loading players...</div>;
    }

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

