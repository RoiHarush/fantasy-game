import React from 'react';

function PlayerKit({ teamId, type = "field", className, style }) {
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

    return (
        <img
            className={className}
            style={style}
            src={`/Kits/${teamId}_${type}.webp`}
            alt={`Team ${teamId} Kit`}
        />
    );
}

export default PlayerKit;

