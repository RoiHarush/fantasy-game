import Style from "../../../Styles/Scout.module.css";
import { usePlayers } from "../../../Context/PlayersContext";
import PlayersWrapper from "../../General/PlayersWrapper";
import { useAllTeamFixtures } from "../../../hooks/useAllTeamFixtures";

function Scout({ user }) {
    const { players } = usePlayers();

    if (!players || players.length === 0) {
        return <div>Loading players...</div>;
    }

    const allTeamFixtures = useAllTeamFixtures();

    return (
        <div className={Style.scoutPage}>
            <h2 className={Style.title}>Scout</h2>
            <PlayersWrapper
                user={user}
                allTeamFixtures={allTeamFixtures}
            />
        </div>
    );
}

export default Scout;
