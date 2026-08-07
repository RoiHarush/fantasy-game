import Style from "../../../Styles/FixturesTable.module.css";
import { useTeams } from "../../../Context/TeamsContext";

function TeamLogo({ teamId }) {
    const { teams } = useTeams();
    const team = teams.find(item => item.id === teamId);
    const localFallback = `/Logos/${teamId}_logo.svg`;
    const badgeUrl = team?.badgeUrl || localFallback;

    return (
        <img
            src={badgeUrl}
            alt={`${team?.name || `Team ${teamId}`} logo`}
            className={Style["team-logo"]}
            onError={event => {
                if (!event.currentTarget.src.endsWith(localFallback)) {
                    event.currentTarget.src = localFallback;
                }
            }}
        />
    )
}

export default TeamLogo
