import { useMemo, useState, useSyncExternalStore } from "react";

import { usePlayers } from "../../../features/players/usePlayers";
import { usePlayersOfTheWeek } from "../../../features/status/useStatusData";
import styles from "../../../Styles/PlayerOfTheWeekBlock.module.css";
import { getPlayerById } from "../../../Utils/ItemGetters";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import PlayerOfWeekCard from "../../General/PlayerOfTheWeekCard";

function subscribeToMobileViewport(callback) {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileSnapshot() {
    return window.matchMedia("(max-width: 767px)").matches;
}

function PlayerCarousel({ records, gameweekId, mobile, onSelect }) {
    const visibleCount = mobile ? 3 : 5;
    const cardWidth = mobile ? 100 : 120;
    const topPlayers = useMemo(() => {
        const full = Array.from({ length: 38 }, (_, index) => {
            const gameweek = index + 1;
            return records.find(player => player.gameweek === gameweek) || {
                gameweek,
                playerName: null,
                teamId: null,
                points: null,
            };
        });
        return [...full.slice(-visibleCount), ...full, ...full.slice(0, visibleCount)];
    }, [records, visibleCount]);
    const initialIndex = gameweekId
        ? visibleCount + Math.min(gameweekId - 1, 37) - (visibleCount - 1)
        : visibleCount;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isTransitioning, setIsTransitioning] = useState(false);

    function move(direction) {
        setIsTransitioning(true);
        setCurrentIndex(current => current + direction);
    }

    function handleTransitionEnd() {
        const total = 38;
        setIsTransitioning(false);
        if (currentIndex >= total + visibleCount) setCurrentIndex(currentIndex - total);
        else if (currentIndex < visibleCount) setCurrentIndex(currentIndex + total);
    }

    return (
        <div className={styles.carouselWrapper}>
            <button type="button" className={styles.arrow} onClick={() => move(-1)} aria-label="Previous gameweek">‹</button>
            <div className={styles.viewport}>
                <div
                    className={styles.track}
                    style={{
                        transform: `translateX(${currentIndex * cardWidth * -1}px)`,
                        transition: isTransitioning ? "transform 0.4s ease-in-out" : "none",
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {topPlayers.map((player, index) => (
                        <button
                            type="button"
                            key={`player-${player?.gameweek ?? index}-${index}`}
                            className={styles.cardWrapper}
                            onClick={() => player?.id && onSelect(player)}
                        >
                            <PlayerOfWeekCard player={player} size={mobile ? "small" : "normal"} />
                        </button>
                    ))}
                </div>
            </div>
            <button type="button" className={styles.arrow} onClick={() => move(1)} aria-label="Next gameweek">›</button>
        </div>
    );
}

function PlayerOfTheWeekBlock({ gameweekId }) {
    const { players } = usePlayers();
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const mobile = useSyncExternalStore(subscribeToMobileViewport, getMobileSnapshot, () => false);
    const playersOfWeekQuery = usePlayersOfTheWeek();
    const records = playersOfWeekQuery.data?.playersOfTheWeek ?? [];
    const selectedPlayerDetails = selectedPlayer
        ? getPlayerById(players, selectedPlayer.id)
        : null;

    return (
        <div className={styles.block}>
            <div className={styles.header}><span className={styles.icon}>★</span>Player of the Week</div>
            {playersOfWeekQuery.isPending ? (
                <p role="status">Loading players of the week…</p>
            ) : playersOfWeekQuery.error ? (
                <p role="alert">Players of the week are temporarily unavailable.</p>
            ) : (
                <PlayerCarousel
                    key={`${mobile}-${gameweekId}-${playersOfWeekQuery.dataUpdatedAt}`}
                    records={records}
                    gameweekId={gameweekId}
                    mobile={mobile}
                    onSelect={setSelectedPlayer}
                />
            )}
            {selectedPlayerDetails && (
                <PlayerInfoModal
                    player={selectedPlayerDetails}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
}

export default PlayerOfTheWeekBlock;
