function PlayerKit({ teamId, type = "field", className }) {
    return (
        <img
            className={className}
            src={`/Kits/${teamId}_${type}.webp`}
            alt={`Team ${teamId} Kit`}
        />
    );
}

export default PlayerKit

