import { useEffect, useState } from "react";
import LeagueControlPage from "../Admin/LeagueControlPage";
import { AdminService } from "../../../services/adminService";
import { fetchMaintenanceLeagues } from "../../../services/leagueService";

const panelStyle = {
    background: "white",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
};

export default function LeagueMaintenancePage() {
    const [leagues, setLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState("");
    const [draftTime, setDraftTime] = useState("");
    const [draftConfig, setDraftConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMaintenanceLeagues()
            .then(setLeagues)
            .catch(loadError => setError(loadError.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setMessage("");
        setError("");
        setDraftTime("");
        setDraftConfig(null);
        if (!selectedLeagueId) return;

        AdminService.getDraftConfig(selectedLeagueId)
            .then(config => {
                setDraftConfig(config);
                if (config?.scheduledTime) setDraftTime(config.scheduledTime.slice(0, 16));
            })
            .catch(loadError => setError(loadError.message));
    }, [selectedLeagueId]);

    async function runAction(action, successMessage) {
        setActionLoading(true);
        setMessage("");
        setError("");
        try {
            await action();
            setMessage(successMessage);
            const config = await AdminService.getDraftConfig(selectedLeagueId);
            setDraftConfig(config);
        } catch (actionError) {
            setError(actionError.message);
        } finally {
            setActionLoading(false);
        }
    }

    const selectedLeague = leagues.find(league => String(league.id) === selectedLeagueId);

    return (
        <div>
            <section style={panelStyle} aria-labelledby="maintenance-title">
                <h1 id="maintenance-title" style={{ marginTop: 0 }}>League maintenance</h1>
                <p>
                    Select one league before making changes. Every request carries its league ID explicitly;
                    this does not make the super admin the league owner.
                </p>
                <label style={{ display: "block", maxWidth: "520px", fontWeight: 700 }}>
                    Maintenance scope
                    <select
                        value={selectedLeagueId}
                        onChange={event => setSelectedLeagueId(event.target.value)}
                        disabled={loading || actionLoading}
                        style={{ display: "block", width: "100%", marginTop: "8px", padding: "10px" }}
                    >
                        <option value="">No league selected</option>
                        {leagues.map(league => (
                            <option key={league.id} value={league.id}>
                                {league.name}{league.leagueCode ? ` (${league.leagueCode})` : ""} · {league.participantCount}/{league.maxParticipants}
                            </option>
                        ))}
                    </select>
                </label>
                {selectedLeague && (
                    <button
                        type="button"
                        onClick={() => setSelectedLeagueId("")}
                        style={{ marginTop: "12px", padding: "8px 12px" }}
                    >
                        Exit maintenance scope
                    </button>
                )}
                {error && <p style={{ color: "#991b1b" }}>{error}</p>}
                {message && <p style={{ color: "#166534" }}>{message}</p>}
            </section>

            {selectedLeagueId && (
                <>
                    <section style={panelStyle} aria-labelledby="draft-maintenance-title">
                        <h2 id="draft-maintenance-title" style={{ marginTop: 0 }}>Initial draft</h2>
                        <p>
                            Current state: <strong>{selectedLeague?.status || "Unknown"}</strong>
                            {draftConfig?.scheduledTime && ` · scheduled for ${draftConfig.scheduledTime}`}
                        </p>
                        <input
                            type="datetime-local"
                            value={draftTime}
                            onChange={event => setDraftTime(event.target.value)}
                            disabled={actionLoading}
                            style={{ padding: "9px", marginRight: "8px" }}
                        />
                        <button
                            type="button"
                            disabled={!draftTime || actionLoading}
                            onClick={() => runAction(
                                () => AdminService.scheduleDraft(draftTime, selectedLeagueId),
                                "Draft scheduled."
                            )}
                            style={{ padding: "9px 12px", marginRight: "8px" }}
                        >
                            Schedule draft
                        </button>
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => {
                                if (window.confirm("Start this league's initial draft now?")) {
                                    runAction(
                                        () => AdminService.openDraftNow(selectedLeagueId),
                                        "Draft started."
                                    );
                                }
                            }}
                            style={{ padding: "9px 12px", marginRight: "8px" }}
                        >
                            Open now
                        </button>
                        <button
                            type="button"
                            disabled={actionLoading || !draftConfig}
                            onClick={() => runAction(
                                () => AdminService.deleteDraft(selectedLeagueId),
                                "Draft schedule cleared."
                            )}
                            style={{ padding: "9px 12px", color: "#991b1b" }}
                        >
                            Clear schedule
                        </button>
                    </section>

                    <LeagueControlPage
                        key={selectedLeagueId}
                        maintenanceLeagueId={Number(selectedLeagueId)}
                    />
                </>
            )}
        </div>
    );
}
