function PlayerKit({ teamId, type = "field", className }) {
    if (teamId === 0) {
        return (
            <img
                className={className}
                src={`/Kits/0.webp`}
                alt={`Team ${teamId} Kit`}
            />
        )
    }

    return (
        <img
            className={className}
            src={`/Kits/${teamId}_${type}.webp`}
            alt={`Team ${teamId} Kit`}
        />
    );
}

export default PlayerKit

