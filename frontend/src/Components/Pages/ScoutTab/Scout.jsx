import { usePlayers } from "../../../Context/PlayersContext";
import { useAllTeamFixtures } from "../../../hooks/useAllTeamFixtures";
import Style from "../../../Styles/Scout.module.css";
import PlayersWrapper from "../../General/PlayersWrapper";

function Scout({ user }) {
    const { players } = usePlayers();

    const allTeamFixtures = useAllTeamFixtures();

    if (!players || players.length === 0) {
        return <div>Loading players...</div>;
    }

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
