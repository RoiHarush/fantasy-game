import { usePlayers } from "../../../features/players/usePlayers";
import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import Style from "../../../Styles/Scout.module.css";
import PlayersWrapper from "../../General/PlayersWrapper";

function Scout({ user, squad, waiverEntries, onWaiverEntriesChange, waiverSaving, waiverMessage, waiverGameweekId }) {
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
                squad={squad}
                waiverEntries={waiverEntries}
                onWaiverEntriesChange={onWaiverEntriesChange}
                waiverSaving={waiverSaving}
                waiverMessage={waiverMessage}
                waiverGameweekId={waiverGameweekId}
            />
        </div>
    );
}

export default Scout;
