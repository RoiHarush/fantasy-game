import { useTeam } from '../../Context/TeamsContext';

function PlayerKit({ teamId, type = "field", className, style, ...imageProps }) {
    const team = useTeam(teamId);

    if (teamId === 0) {
        return (
            <img
                {...imageProps}
                className={className}
                style={style}
                src={`/Kits/0.webp`}
                alt={`Team ${teamId} Kit`}
                onError={event => {
                    if (event.currentTarget.dataset.fallbackStage === "placeholder") return;
                    event.currentTarget.dataset.fallbackStage = "placeholder";
                    event.currentTarget.src = "/UI/player-placeholder.svg";
                }}
            />
        )
    }

    const localFallback = `/Kits/${teamId}_${type}.webp`;
    const kitUrl = type === "gk"
        ? team?.goalkeeperKitUrl || localFallback
        : team?.fieldKitUrl || localFallback;

    return (
        <img
            {...imageProps}
            className={className}
            style={style}
            src={kitUrl}
            alt={`${team?.name || `Team ${teamId}`} ${type === "gk" ? "goalkeeper" : "outfield"} kit`}
            onError={event => {
                const image = event.currentTarget;
                if (image.dataset.fallbackStage !== "local" && !image.src.endsWith(localFallback)) {
                    image.dataset.fallbackStage = "local";
                    image.src = localFallback;
                    return;
                }
                if (image.dataset.fallbackStage !== "placeholder") {
                    image.dataset.fallbackStage = "placeholder";
                    image.src = "/UI/player-placeholder.svg";
                }
            }}
        />
    );
}

export default PlayerKit;

