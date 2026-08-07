"use client";

import { useMemo, useState } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { usePlayers } from "../../../Context/PlayersContext";
import { useSquad } from "../../../features/squad/useSquad";
import { useWaiverPlan } from "../../../features/waivers/useWaiverPlan";
import styles from "../../../Styles/WaiverPlanner.module.css";

function WaiverPlannerPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();
    const { players } = usePlayers();
    const [selectedPlayerInId, setSelectedPlayerInId] = useState("");
    const [selectedPlayerOutId, setSelectedPlayerOutId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const squadQuery = useSquad(user?.id, nextGameweek?.id);
    const waiverPlan = useWaiverPlan(nextGameweek?.id);
    const { entries, setEntries, saving } = waiverPlan;

    const squadPlayerIds = useMemo(() => {
        const lineupIds = Object.values(squadQuery.data?.startingLineup || {}).flat();
        const benchIds = Object.values(squadQuery.data?.bench || {}).filter(id => id != null);
        return [...new Set([...lineupIds, ...benchIds])];
    }, [squadQuery.data]);

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
            .filter(player => !squadPlayerIds.includes(player.id))
            .sort((first, second) => first.viewName.localeCompare(second.viewName)),
        [players, squadPlayerIds]
    );
    const eligibleOutgoingPlayers = selectedIncoming
        ? squadPlayers.filter(player => player.position === selectedIncoming.position)
        : squadPlayers;

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
        setError("");
        setMessage("");
        try {
            await waiverPlan.saveEntries(entries);
            setMessage("Priority list saved. It will run only if you are offline on your turn.");
        } catch (saveError) {
            setError(saveError.message);
        }
    }

    function playerName(playerId) {
        return playersById.get(playerId)?.viewName || `Player #${playerId}`;
    }

    if (!nextGameweek) {
        return <section className={styles.page}><p>No upcoming gameweek is available.</p></section>;
    }
    if (squadQuery.isPending || waiverPlan.loading) {
        return <section className={styles.page}><p>Loading waiver plan…</p></section>;
    }

    const loadError = squadQuery.error?.message || waiverPlan.error?.message;

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
                {(error || loadError) && <p className={styles.error}>{error || loadError}</p>}
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
