import styles from "../../../Styles/Scout.module.css";
import PlayersWrapper from "../../General/PlayersWrapper";

function Scout({ user, players, teams, fixturesByTeam, squad, waiverEntries, onWaiverEntriesChange, waiverSaving, waiverMessage, waiverGameweekId }) {
    if (players.length === 0) return <p role="status">No players are available.</p>;

    return (
        <div className={styles.scoutPage}>
            <h2 className={styles.title}>Scout</h2>
            <PlayersWrapper
                user={user}
                players={players}
                teams={teams}
                allTeamFixtures={fixturesByTeam}
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
