export function getPlayerInjuryColor(chanceOfPlaying) {
    if (chanceOfPlaying == null || chanceOfPlaying >= 100) return null;
    if (chanceOfPlaying === 0) return "#d81919";
    if (chanceOfPlaying <= 25) return "#ff3b1f";
    if (chanceOfPlaying <= 50) return "#ff6b4a";
    if (chanceOfPlaying <= 75) return "#ff8c80";
    return null;
}
