import { lazy, Suspense, useEffect, useState } from "react";
import {
    fetchMaintenanceLeague,
    fetchMyLeague,
    updateLeagueSettings,
    updateMaintenanceLeagueSettings
} from "../../../services/leagueService";
import styles from "../../../Styles/LeagueControl.module.css";

const AssistManager = lazy(() => import("./AssistManager"));
const PenaltyManager = lazy(() => import("./PenaltyManager"));
const LockedPlayersManager = lazy(() => import("./LockedPlayersManager"));
const PositionManager = lazy(() => import("./PositionManager"));

function LeagueControlPage({ maintenanceLeagueId = null }) {
    const [activeTab, setActiveTab] = useState("settings");
    const [league, setLeague] = useState(null);
    const [name, setName] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(8);
    const [scoringRules, setScoringRules] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const loadLeague = maintenanceLeagueId
            ? fetchMaintenanceLeague(maintenanceLeagueId)
            : fetchMyLeague();
        loadLeague
            .then(data => {
                setLeague(data);
                setName(data.name);
                setMaxParticipants(data.maxParticipants);
                setScoringRules(data.scoringRules || {});
            })
            .catch(loadError => setError(loadError.message))
            .finally(() => setLoading(false));
    }, [maintenanceLeagueId]);

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const saveSettings = maintenanceLeagueId
                ? updateMaintenanceLeagueSettings
                : updateLeagueSettings;
            const updated = await saveSettings(league.id, {
                name,
                maxParticipants: Number(maxParticipants),
                scoringRules
            });
            setLeague(updated);
            setMessage("League settings saved.");
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <section className={styles.page}><p>Loading league settings…</p></section>;
    if (!league) return <section className={styles.page}><p className={styles.error}>{error}</p></section>;

    return (
        <section className={styles.page} aria-labelledby="league-control-title">
            <header>
                <p className={styles.eyebrow}>
                    {maintenanceLeagueId ? "Super admin maintenance" : "League admin"}
                </p>
                <h1 id="league-control-title">League settings</h1>
                <p>
                    Invite code: <strong>{league.leagueCode}</strong> · {league.participantCount} current managers
                </p>
            </header>

            <nav className={styles.tabs} aria-label="League administration sections">
                {[
                    ["settings", "Settings"],
                    ["assists", "Assists"],
                    ["penalties", "Penalties"],
                    ["locks", "Locks"],
                    ["positions", "Positions"]
                ].map(([tab, label]) => (
                    <button
                        key={tab}
                        type="button"
                        className={activeTab === tab ? styles.activeTab : ""}
                        aria-current={activeTab === tab ? "page" : undefined}
                        onClick={() => setActiveTab(tab)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            {activeTab === "settings" && <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.generalGrid}>
                    <label>
                        League name
                        <input value={name} onChange={event => setName(event.target.value)} required />
                    </label>
                    <label>
                        Maximum participants
                        <input
                            type="number"
                            min={league.participantCount}
                            max="20"
                            value={maxParticipants}
                            onChange={event => setMaxParticipants(event.target.value)}
                            required
                        />
                    </label>
                </div>

                <details className={styles.rules} open>
                    <summary>Scoring rules</summary>
                    <p>Changes affect the next points calculation and are isolated to this league.</p>
                    <div className={styles.ruleGrid}>
                        {Object.entries(scoringRules)
                            .sort(([leftRule], [rightRule]) => leftRule.localeCompare(rightRule))
                            .map(([rule, points]) => (
                            <label key={rule}>
                                {rule.replaceAll("_", " ").replace(".", " · ")}
                                <input
                                    type="number"
                                    min="-100"
                                    max="100"
                                    value={points}
                                    onChange={event => setScoringRules(current => ({
                                        ...current,
                                        [rule]: Number(event.target.value)
                                    }))}
                                />
                            </label>
                            ))}
                    </div>
                </details>

                <div className={styles.feedback} aria-live="polite">
                    {error && <p className={styles.error}>{error}</p>}
                    {message && <p className={styles.success}>{message}</p>}
                </div>

                <button className={styles.save} disabled={saving}>
                    {saving ? "Saving…" : "Save league settings"}
                </button>
            </form>}

            <div className={styles.playerControls} hidden={activeTab === "settings"}>
                <Suspense fallback={<p role="status">Loading league controls…</p>}>
                    {activeTab === "assists" && <AssistManager maintenanceLeagueId={maintenanceLeagueId} />}
                    {activeTab === "penalties" && <PenaltyManager maintenanceLeagueId={maintenanceLeagueId} />}
                    {activeTab === "locks" && <LockedPlayersManager maintenanceLeagueId={maintenanceLeagueId} />}
                    {activeTab === "positions" && <PositionManager maintenanceLeagueId={maintenanceLeagueId} />}
                </Suspense>
            </div>
        </section>
    );
}

export default LeagueControlPage;
