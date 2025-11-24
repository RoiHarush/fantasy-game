import { useEffect, useState } from "react";
import API_URL from "../../../config";
import styles from "../../../Styles/PlayerOfTheWeekBlock.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";
import PlayerOfWeekCard from "../../General/PlayerOfTheWeekCard";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import { getPlayerById } from "../../../Utils/ItemGetters";
import { usePlayers } from "../../../Context/PlayersContext";

function PlayerOfTheWeekBlock() {
    const { currentGameweek } = useGameweek();
    const { players } = usePlayers();
    const [topPlayers, setTopPlayers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const visibleCount = 5;
    const cardWidth = 130 + 25;
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        async function fetchPlayers() {
            try {
                const res = await fetch(`${API_URL}/api/fpl/players-of-the-week`);
                const data = await res.json();
                const arr = data.playersOfTheWeek || [];

                const full = Array.from({ length: 38 }, (_, i) => {
                    const gw = i + 1;
                    return (
                        arr.find((p) => p.gameweek === gw) || {
                            gameweek: gw,
                            playerName: null,
                            teamId: null,
                            points: null,
                        }
                    );
                });

                const circular = [
                    ...full.slice(-visibleCount),
                    ...full,
                    ...full.slice(0, visibleCount),
                ];

                setTopPlayers(circular);
                setCurrentIndex(visibleCount);
            } catch (err) {
                console.error("❌ Failed to load players of the week:", err);
            }
        }
        fetchPlayers();
    }, []);

    useEffect(() => {
        if (currentGameweek && topPlayers.length > 0) {
            const total = 38;
            const gwIndex = Math.min(currentGameweek.id - 1, total - 1);
            setCurrentIndex(gwIndex + visibleCount + 1);
        }
    }, [currentGameweek, topPlayers]);

    const next = () => {
        if (topPlayers.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const prev = () => {
        if (topPlayers.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    };

    const handleTransitionEnd = () => {
        const total = 38;
        setIsTransitioning(false);

        if (currentIndex >= total + visibleCount) {
            setCurrentIndex(visibleCount);
        } else if (currentIndex < visibleCount) {
            setCurrentIndex(total + visibleCount - 1);
        }
    };

    const offset = (currentIndex - visibleCount) * cardWidth * -1;

    return (
        <div className={styles.block}>
            <div className={styles.header}>
                <span className={styles.icon}>★</span>
                2025/26 Player of the Week
            </div>

            <div className={styles.carouselWrapper}>
                <button className={styles.arrow} onClick={prev}>
                    ‹
                </button>

                <div className={styles.viewport}>
                    <div
                        className={styles.track}
                        style={{
                            transform: `translateX(${offset}px)`,
                            transition: isTransitioning ? "transform 0.4s ease-in-out" : "none",
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {topPlayers.map((p, idx) => (
                            <div
                                key={`player-${p?.gameweek ?? idx}-${idx}`}
                                className={styles.cardWrapper}
                                onClick={() => p?.id && setSelectedPlayer(p)}
                            >
                                <PlayerOfWeekCard player={p} />
                            </div>
                        ))}
                    </div>
                </div>

                <button className={styles.arrow} onClick={next}>
                    ›
                </button>
            </div>

            {selectedPlayer && (
                <PlayerInfoModal
                    player={getPlayerById(players, selectedPlayer.id)}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
}

export default PlayerOfTheWeekBlock;
