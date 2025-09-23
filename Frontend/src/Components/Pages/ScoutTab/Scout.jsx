import { useState } from "react";
import ScoutWrapper from "./ScoutWrapper";
import Style from "../../../Styles/Scout.module.css";

function Scout({ initialUser, players }) {
    const [user, setUser] = useState(initialUser);

    return (
        <div className={Style.scoutPage}>
            <h2 className={Style.title}>Scout</h2>
            <ScoutWrapper players={players} user={user} setUser={setUser} />
        </div>
    );
}

export default Scout;
