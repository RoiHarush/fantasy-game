import { useMemo, useState, useSyncExternalStore } from "react";

import { usePlayers } from "../../../features/players/usePlayers";
import { usePlayersOfTheWeek } from "../../../features/status/useStatusData";
import { ArrowLeft, ArrowRight, Star } from "../../../shared/ui/icons";
import { getPlayerById } from "../../../Utils/ItemGetters";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import PlayerOfWeekCard from "../../General/PlayerOfTheWeekCard";
import { Button } from "../../../shared/ui/Button";

function subscribeToMobileViewport(callback) {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileSnapshot() {
    return window.matchMedia("(max-width: 767px)").matches;
}

export function initialCarouselStart(gameweekId, visibleCount, total = 38) {
    const currentIndex = Math.max(0, Math.min((gameweekId ?? 1) - 1, total - 1));
    return Math.max(0, currentIndex - (visibleCount - 1));
}

export function carouselGameweeks(windowStart, visibleCount, total = 38) {
    return Array.from(
        { length: visibleCount },
        (_, offset) => ((windowStart + offset) % total) + 1,
    );
}

function PlayerCarousel({ records, gameweekId, mobile, onSelect }) {
    const visibleCount = mobile ? 3 : 5;
    const allGameweeks = useMemo(() => (
        Array.from({ length: 38 }, (_, index) => {
            const gameweek = index + 1;
            return records.find(player => player.gameweek === gameweek) || {
                gameweek,
                playerName: null,
                teamId: null,
                points: null,
            };
        })
    ), [records]);
    const carouselTrack = useMemo(() => (
        [
            ...allGameweeks.slice(-visibleCount),
            ...allGameweeks,
            ...allGameweeks.slice(0, visibleCount),
        ]
    ), [allGameweeks, visibleCount]);
    const initialStart = initialCarouselStart(gameweekId, visibleCount);
    const [currentIndex, setCurrentIndex] = useState(visibleCount + initialStart);
    const [isTransitioning, setIsTransitioning] = useState(false);

    function move(direction) {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(current => current + direction);
    }

    function handleTransitionEnd() {
        setIsTransitioning(false);
        if (currentIndex >= allGameweeks.length + visibleCount) {
            setCurrentIndex(currentIndex - allGameweeks.length);
        } else if (currentIndex < visibleCount) {
            setCurrentIndex(currentIndex + allGameweeks.length);
        }
    }

    return (
        <div className="grid w-full grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-0.5 px-1 py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] sm:gap-2 sm:px-0">
            <Button type="button" variant="secondary" size="icon" className="size-8 justify-self-center sm:size-9" onClick={() => move(-1)} aria-label="Previous gameweek"><ArrowLeft className="size-4" aria-hidden="true" /></Button>
            <div className="min-w-0 overflow-hidden">
                <div
                    className="flex will-change-transform"
                    style={{
                        transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                        transition: isTransitioning ? "transform 0.4s ease-in-out" : "none",
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {carouselTrack.map((player, index) => (
                        <Button
                            type="button"
                            variant="ghost"
                            key={`player-${player.gameweek}-${index}`}
                            className="flex h-auto min-w-0 shrink-0 justify-center px-0 py-0 sm:px-1"
                            style={{ width: `${100 / visibleCount}%` }}
                            onClick={() => player?.id && onSelect(player)}
                        >
                            <PlayerOfWeekCard player={player} size={mobile ? "small" : "normal"} />
                        </Button>
                    ))}
                </div>
            </div>
            <Button type="button" variant="secondary" size="icon" className="size-8 justify-self-center sm:size-9" onClick={() => move(1)} aria-label="Next gameweek"><ArrowRight className="size-4" aria-hidden="true" /></Button>
        </div>
    );
}

function PlayerOfTheWeekBlock({ userId, gameweekId, previewRecords, previewPlayers }) {
    const playersQuery = usePlayers();
    const players = previewPlayers ?? playersQuery.players;
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const mobile = useSyncExternalStore(subscribeToMobileViewport, getMobileSnapshot, () => false);
    const preview = Array.isArray(previewRecords);
    const playersOfWeekQuery = usePlayersOfTheWeek(userId, !preview);
    const records = preview ? previewRecords : playersOfWeekQuery.data?.playersOfTheWeek ?? [];
    const pending = !preview && playersOfWeekQuery.isPending;
    const error = !preview && playersOfWeekQuery.error;
    const selectedPlayerDetails = selectedPlayer
        ? getPlayerById(players, selectedPlayer.id)
        : null;

    return (
        <section className="w-full overflow-hidden rounded-xl border border-app-border bg-app-surface pb-4 shadow-sm transition-colors">
            <div className="flex items-center gap-2 bg-component-gradient px-4 py-3 text-base font-bold text-brand-ink sm:text-xl"><Star className="size-5 text-brand-green" aria-hidden="true" />Player of the Week</div>
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
