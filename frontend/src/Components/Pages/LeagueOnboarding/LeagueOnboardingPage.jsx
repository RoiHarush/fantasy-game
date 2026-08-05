"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API_URL from "../../../config";
import { useAuth } from "../../../Context/AuthContext";
import { getAuthHeaders } from "../../../services/authHelper";
import styles from "../../../Styles/LeagueOnboarding.module.css";

export default function LeagueOnboardingPage() {
    const [mode, setMode] = useState("create");
    const [leagueName, setLeagueName] = useState("");
    const [teamName, setTeamName] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(8);
    const [leagueCode, setLeagueCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [scoringRules, setScoringRules] = useState({});
    const [createdLeague, setCreatedLeague] = useState(null);
    const [copied, setCopied] = useState(false);
    const { updateUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (mode !== "create" || Object.keys(scoringRules).length > 0) return;
        fetch(`${API_URL}/api/leagues/scoring-rules/defaults`, { headers: getAuthHeaders() })
            .then(response => {
                if (!response.ok) throw new Error("Could not load scoring rules");
                return response.json();
            })
            .then(setScoringRules)
            .catch(requestError => setError(requestError.message));
    }, [mode, scoringRules]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        const creating = mode === "create";
        const endpoint = creating ? `${API_URL}/api/leagues` : `${API_URL}/api/leagues/join`;
        const payload = creating
            ? {
                name: leagueName,
                maxParticipants: Number(maxParticipants),
                fantasyTeamName: teamName,
                scoringRules
            }
            : { leagueCode: leagueCode.trim().toUpperCase(), fantasyTeamName: teamName };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.error || "Could not complete league setup");
            }

            const league = await response.json();
            updateUser({
                leagueId: league.id,
                leagueAdmin: league.currentUserAdmin,
                leagueStatus: league.status,
                fantasyTeamName: teamName || undefined
            });
            if (creating) {
                setCreatedLeague(league);
            } else {
                router.replace("/status");
            }
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (createdLeague) {
        return (
            <section className={styles.page} aria-labelledby="league-created-title">
                <div className={styles.card}>
                    <p className={styles.eyebrow}>League created</p>
                    <h1 id="league-created-title">Invite your managers</h1>
                    <p>Share this code before the initial draft begins:</p>
                    <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: ".16em", margin: "1.5rem 0" }}>
                        {createdLeague.leagueCode}
                    </div>
                    <button type="button" onClick={async () => {
                        await navigator.clipboard.writeText(createdLeague.leagueCode);
                        setCopied(true);
                    }}>
                        {copied ? "Code copied!" : "Copy league code"}
                    </button>
                    <button type="button" className={styles.submit} onClick={() => router.replace("/draft-room")}>
                        Set up initial draft
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.page} aria-labelledby="league-onboarding-title">
            <div className={styles.card}>
                <p className={styles.eyebrow}>Welcome to Fantasy Draft</p>
                <h1 id="league-onboarding-title">Choose your league</h1>
                <p className={styles.intro}>
                    Create a league for your group or join one using a code from a friend.
                </p>

                <div className={styles.tabs} role="tablist" aria-label="League setup options">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "create"}
                        className={mode === "create" ? styles.activeTab : ""}
                        onClick={() => setMode("create")}
                    >
                        Create league
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "join"}
                        className={mode === "join" ? styles.activeTab : ""}
                        onClick={() => setMode("join")}
                    >
                        Join league
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {mode === "create" ? (
                        <>
                            <label>
                                League name
                                <input value={leagueName} onChange={(event) => setLeagueName(event.target.value)} required />
                            </label>
                            <label>
                                Maximum participants
                                <input
                                    type="number"
                                    min="2"
                                    max="20"
                                    value={maxParticipants}
                                    onChange={(event) => setMaxParticipants(event.target.value)}
                                    required
                                />
                            </label>
                            <details className={styles.scoringSettings}>
                                <summary>Customize scoring rules</summary>
                                <p>These values are stored per league and can be changed later by the league admin.</p>
                                <div className={styles.scoringGrid}>
                                    {Object.entries(scoringRules).map(([rule, points]) => (
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
                        </>
                    ) : (
                        <label>
                            League code
                            <input
                                value={leagueCode}
                                onChange={(event) => setLeagueCode(event.target.value.toUpperCase())}
                                minLength="6"
                                maxLength="12"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Fantasy team name
                        <input value={teamName} onChange={(event) => setTeamName(event.target.value)} required />
                    </label>

                    {error && <p className={styles.error} role="alert">{error}</p>}
                    <button className={styles.submit} disabled={submitting}>
                        {submitting ? "Saving…" : mode === "create" ? "Create league" : "Join league"}
                    </button>
                </form>
            </div>
        </section>
    );
}
