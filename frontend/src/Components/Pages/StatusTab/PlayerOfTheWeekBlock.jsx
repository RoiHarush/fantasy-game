import { useMemo, useState, useSyncExternalStore } from "react";

import { usePlayers } from "../../../features/players/usePlayers";
import { usePlayersOfTheWeek } from "../../../features/status/useStatusData";
import { cn } from "../../../lib/cn";
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
        <div className="relative flex items-center justify-center py-3">
            <button type="button" className="mx-1 shrink-0 rounded-lg bg-app-surface-muted px-2 py-1 text-2xl text-app-foreground transition hover:bg-app-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple sm:mx-2 sm:px-3 sm:text-3xl" onClick={() => move(-1)} aria-label="Previous gameweek">‹</button>
            <div className="w-[min(300px,calc(100vw-6rem))] overflow-hidden md:w-[600px]">
                <div
                    className="flex will-change-transform"
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
                            className={cn(
                                "flex shrink-0 justify-center px-1.5",
                                mobile ? "w-[100px]" : "w-[120px]",
                            )}
                            onClick={() => player?.id && onSelect(player)}
                        >
                            <PlayerOfWeekCard player={player} size={mobile ? "small" : "normal"} />
                        </button>
                    ))}
                </div>
            </div>
            <button type="button" className="mx-1 shrink-0 rounded-lg bg-app-surface-muted px-2 py-1 text-2xl text-app-foreground transition hover:bg-app-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple sm:mx-2 sm:px-3 sm:text-3xl" onClick={() => move(1)} aria-label="Next gameweek">›</button>
        </div>
    );
}

function PlayerOfTheWeekBlock({ gameweekId, previewRecords, previewPlayers }) {
    const playersQuery = usePlayers();
    const players = previewPlayers ?? playersQuery.players;
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const mobile = useSyncExternalStore(subscribeToMobileViewport, getMobileSnapshot, () => false);
    const preview = Array.isArray(previewRecords);
    const playersOfWeekQuery = usePlayersOfTheWeek(!preview);
    const records = preview ? previewRecords : playersOfWeekQuery.data?.playersOfTheWeek ?? [];
    const pending = !preview && playersOfWeekQuery.isPending;
    const error = !preview && playersOfWeekQuery.error;
    const selectedPlayerDetails = selectedPlayer
        ? getPlayerById(players, selectedPlayer.id)
        : null;

    return (
        <section className="w-full overflow-hidden rounded-xl border border-app-border bg-app-surface pb-4 shadow-sm transition-colors">
            <div className="flex items-center gap-2 bg-component-gradient px-4 py-3 text-base font-bold text-brand-ink sm:text-xl"><span className="text-xl text-brand-green" aria-hidden="true">★</span>Player of the Week</div>
            {pending ? (
                <p role="status" className="p-4 text-app-muted">Loading players of the week…</p>
            ) : error ? (
                <p role="alert" className="p-4 text-red-600 dark:text-red-300">Players of the week are temporarily unavailable.</p>
            ) : (
                <PlayerCarousel
                    key={`${mobile}-${gameweekId}-${preview ? "preview" : playersOfWeekQuery.dataUpdatedAt}`}
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
        </section>
    );
}

export default PlayerOfTheWeekBlock;
