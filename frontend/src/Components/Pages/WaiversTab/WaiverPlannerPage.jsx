import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { usePlayers } from "../../../Context/PlayersContext";
import { fetchSquadForGameweek } from "../../../services/squadService";
import { fetchWaiverPlan, saveWaiverPlan } from "../../../services/waiverService";
import styles from "../../../Styles/WaiverPlanner.module.css";

function WaiverPlannerPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();
    const { players } = usePlayers();
    const [squadPlayerIds, setSquadPlayerIds] = useState([]);
    const [entries, setEntries] = useState([]);
    const [selectedPlayerInId, setSelectedPlayerInId] = useState("");
    const [selectedPlayerOutId, setSelectedPlayerOutId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const playersById = useMemo(
        () => new Map(players.map(player => [player.id, player])),
        [players]
    );
    const selectedIncoming = playersById.get(Number(selectedPlayerInId));
    const squadPlayers = useMemo(
        () => squadPlayerIds.map(id => playersById.get(id)).filter(Boolean),
        [playersById, squadPlayerIds]
    );
    const availablePlayers = useMemo(
        () => players
            .filter(player => player.available !== false && !squadPlayerIds.includes(player.id))
            .sort((first, second) => first.viewName.localeCompare(second.viewName)),
        [players, squadPlayerIds]
    );
    const eligibleOutgoingPlayers = selectedIncoming
        ? squadPlayers.filter(player => player.position === selectedIncoming.position)
        : squadPlayers;

    useEffect(() => {
        if (!user?.id || !nextGameweek?.id) return;
        let cancelled = false;
        setLoading(true);
        setError("");

        Promise.all([
            fetchSquadForGameweek(user.id, nextGameweek.id),
            fetchWaiverPlan(nextGameweek.id)
        ])
            .then(([squad, savedEntries]) => {
                if (cancelled) return;
                const lineupIds = Object.values(squad.startingLineup || {}).flat();
                const benchIds = Object.values(squad.bench || {}).filter(id => id != null);
                setSquadPlayerIds([...new Set([...lineupIds, ...benchIds])]);
                setEntries(savedEntries || []);
            })
            .catch(loadError => {
                if (!cancelled) setError(loadError.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [user?.id, nextGameweek?.id]);

    function addEntry() {
        const playerInId = Number(selectedPlayerInId);
        const playerOutId = Number(selectedPlayerOutId);
        if (!playerInId || !playerOutId) {
            setError("Choose both an incoming and an outgoing player.");
            return;
        }
        if (entries.some(entry => entry.playerInId === playerInId && entry.playerOutId === playerOutId)) {
            setError("This exact preference is already in the list.");
            return;
        }
        setEntries(current => [...current, { playerInId, playerOutId }]);
        setSelectedPlayerInId("");
        setSelectedPlayerOutId("");
        setError("");
        setMessage("");
    }

    function moveEntry(index, direction) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= entries.length) return;
        setEntries(current => {
            const reordered = [...current];
            [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
            return reordered;
        });
        setMessage("");
    }

    async function handleSave() {
        if (!nextGameweek?.id) return;
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const saved = await saveWaiverPlan(nextGameweek.id, entries);
            setEntries(saved);
            setMessage("Priority list saved. It will run only if you are offline on your turn.");
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    }

    function playerName(playerId) {
        return playersById.get(playerId)?.viewName || `Player #${playerId}`;
    }

    if (!nextGameweek) {
        return <section className={styles.page}><p>No upcoming gameweek is available.</p></section>;
    }
    if (loading) {
        return <section className={styles.page}><p>Loading waiver plan…</p></section>;
    }

    return (
        <section className={styles.page} aria-labelledby="waiver-title">
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Gameweek {nextGameweek.id}</p>
                    <h1 id="waiver-title">Offline waiver priorities</h1>
                </div>
                <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save priority list"}
                </button>
            </header>

            <p className={styles.explanation}>
                When your turn starts, the server waits 30 seconds. If you are still offline, it tries
                these swaps from top to bottom. The first valid swap wins; with two regular rounds,
                at most two swaps can succeed. If none are valid, your turn passes automatically.
            </p>

            <div className={styles.builder}>
                <label>
                    Player to sign
                    <select
                        value={selectedPlayerInId}
                        onChange={event => {
                            setSelectedPlayerInId(event.target.value);
                            setSelectedPlayerOutId("");
                        }}
                    >
                        <option value="">Choose an available player</option>
                        {availablePlayers.map(player => (
                            <option key={player.id} value={player.id}>
                                {player.viewName} · {player.position}
                            </option>
                        ))}
                    </select>
                </label>

                <span className={styles.swapArrow} aria-hidden="true">for</span>

                <label>
                    Player to release
                    <select
                        value={selectedPlayerOutId}
                        onChange={event => setSelectedPlayerOutId(event.target.value)}
                        disabled={!selectedIncoming}
                    >
                        <option value="">Choose from your squad</option>
                        {eligibleOutgoingPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                                {player.viewName} · {player.position}
                            </option>
                        ))}
                    </select>
                </label>

                <button className={styles.addButton} type="button" onClick={addEntry}>
                    Add priority
                </button>
            </div>

            <div className={styles.feedback} aria-live="polite">
                {error && <p className={styles.error}>{error}</p>}
                {message && <p className={styles.success}>{message}</p>}
            </div>

            <ol className={styles.priorityList}>
                {entries.map((entry, index) => (
                    <li key={`${entry.playerInId}-${entry.playerOutId}`} className={styles.priorityCard}>
                        <span className={styles.priorityNumber}>{index + 1}</span>
                        <div className={styles.swapText}>
                            <strong>{playerName(entry.playerInId)}</strong>
                            <span> replaces </span>
                            <strong>{playerName(entry.playerOutId)}</strong>
                        </div>
                        <div className={styles.actions}>
                            <button
                                type="button"
                                onClick={() => moveEntry(index, -1)}
                                disabled={index === 0}
                                aria-label={`Move priority ${index + 1} up`}
                            >↑</button>
                            <button
                                type="button"
                                onClick={() => moveEntry(index, 1)}
                                disabled={index === entries.length - 1}
                                aria-label={`Move priority ${index + 1} down`}
                            >↓</button>
                            <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => setEntries(current => current.filter((_, itemIndex) => itemIndex !== index))}
                                aria-label={`Remove priority ${index + 1}`}
                            >Remove</button>
                        </div>
                    </li>
                ))}
            </ol>

            {entries.length === 0 && (
                <p className={styles.emptyState}>No priorities yet. An offline turn will pass automatically.</p>
            )}
        </section>
    );
}

export default WaiverPlannerPage;
