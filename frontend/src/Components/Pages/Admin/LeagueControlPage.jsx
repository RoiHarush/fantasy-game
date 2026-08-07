import { lazy, Suspense, useEffect, useState } from "react";
import {
    fetchMaintenanceLeague,
    fetchMyLeague,
    removeLeagueMember,
    updateLeagueSettings,
    updateMaintenanceLeagueSettings
} from "../../../services/leagueService";
import { fetchAllUsers } from "../../../services/usersService";
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
    const [managers, setManagers] = useState([]);

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
        if (!maintenanceLeagueId) {
            fetchAllUsers().then(setManagers).catch(() => setManagers([]));
        }
    }, [maintenanceLeagueId]);

    async function handleRemoveManager(manager) {
        if (!window.confirm(`Remove ${manager.name} from this league?`)) return;
        setError("");
        setMessage("");
        try {
            const updated = await removeLeagueMember(league.id, manager.id);
            setLeague(updated);
            setManagers(current => current.filter(item => item.id !== manager.id));
            setMessage(`${manager.name} was removed from the league.`);
        } catch (removeError) {
            setError(removeError.message);
        }
    }

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
                    {league.leagueCode && <>Invite code: <strong>{league.leagueCode}</strong> · </>}
                    {league.participantCount} current managers
                </p>
            </header>

            <nav className={styles.tabs} aria-label="League administration sections">
                {[
                    ["settings", "Settings"],
                    ...(!maintenanceLeagueId && league.status !== "DRAFT_LIVE" && league.status !== "ACTIVE"
                        ? [["managers", "Managers"]]
                        : []),
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

            {activeTab === "managers" && (
                <section className={styles.form} aria-label="League managers">
                    <p>Managers can be removed until the initial draft starts.</p>
                    {managers.map(manager => (
                        <div key={manager.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: ".75rem 0", borderBottom: "1px solid #ddd" }}>
                            <span>{manager.name} · {manager.fantasyTeamName}</span>
                            {manager.id === league.adminId ? (
                                <strong>League admin</strong>
                            ) : (
                                <button type="button" onClick={() => handleRemoveManager(manager)}>
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <div className={styles.feedback} aria-live="polite">
                        {error && <p className={styles.error}>{error}</p>}
                        {message && <p className={styles.success}>{message}</p>}
                    </div>
                </section>
            )}

            <div className={styles.playerControls} hidden={activeTab === "settings" || activeTab === "managers"}>
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
