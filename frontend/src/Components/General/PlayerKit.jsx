import { useTeam } from '../../Context/TeamsContext';

function PlayerKit({ teamId, type = "field", className, style }) {
    const team = useTeam(teamId);

    if (teamId === 0) {
        return (
            <img
                className={className}
                style={style}
                src={`/Kits/0.webp`}
                alt={`Team ${teamId} Kit`}
            />
        )
    }

    const localFallback = `/Kits/${teamId}_${type}.webp`;
    const kitUrl = type === "gk"
        ? team?.goalkeeperKitUrl || localFallback
        : team?.fieldKitUrl || localFallback;

    return (
        <img
            className={className}
            style={style}
            src={kitUrl}
            alt={`${team?.name || `Team ${teamId}`} ${type === "gk" ? "goalkeeper" : "outfield"} kit`}
            onError={event => {
                if (!event.currentTarget.src.endsWith(localFallback)) {
                    event.currentTarget.src = localFallback;
                }
            }}
        />
    );
}

export default PlayerKit;

