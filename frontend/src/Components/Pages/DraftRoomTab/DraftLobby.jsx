import { useState } from "react";
import { AdminService } from "../../../services/adminService";
import Style from "../../../Styles/DraftLobby.module.css";
import DraftCountdown from "./DraftCountdown";

function DraftLobby({ isAdmin, config, league, onRefresh }) {
    const [scheduledTime, setScheduledTime] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const formatDate = (dateValue) => {
        if (!dateValue) return "No date scheduled";

        if (Array.isArray(dateValue)) {
            const [year, month, day, hour, minute] = dateValue;
            return new Date(year, month - 1, day, hour, minute).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleString('en-GB');
    };

    const handleSchedule = async () => {
        if (!scheduledTime) return;
        try {
            setError("");
            await AdminService.scheduleDraft(scheduledTime);
            await onRefresh();
        } catch (scheduleError) {
            setError(scheduleError.message);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Delete scheduled draft?")) {
            await AdminService.deleteDraft();
            onRefresh();
        }
    };

    const handleOpenNow = async () => {
        if (window.confirm("Start Snake Draft right now?")) {
            try {
                setError("");
                await AdminService.openDraftNow();
                await onRefresh();
            } catch (openError) {
                setError(openError.message);
            }
        }
    };

    const rawDate = config?.scheduledTime || config?.scheduled_time;

    return (
        <div className={Style.lobbyContainer}>
            <div className={Style.card}>
                <h1 className={Style.title}>Draft Room</h1>

                {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}

                {league?.leagueCode && (
                    <div className={Style.scheduledBox}>
                        <p>Share this league code with your friends</p>
                        <h2 className={Style.time}>{league.leagueCode}</h2>
                        <button onClick={async () => {
                            await navigator.clipboard.writeText(league.leagueCode);
                            setCopied(true);
                        }}>
                            {copied ? "Copied!" : "Copy code"}
                        </button>
                        <p>{league.participantCount} / {league.maxParticipants} managers joined</p>
                        {league.participantCount < league.maxParticipants && (
                            <p>The draft will start only after every configured manager has joined.</p>
                        )}
                    </div>
                )}

                {rawDate && !config.processed ? (
                    <div className={Style.scheduledBox}>
                        <p>The draft is scheduled for:</p>
                        <h2 className={Style.time}>
                            {formatDate(rawDate)}
                        </h2>
                        <strong><DraftCountdown value={rawDate} /></strong>
                    </div>
                ) : (
                    <div className={Style.noDraft}>
                        <p>No draft scheduled at the moment.</p>
                    </div>
                )}

                {isAdmin && (
                    <div className={Style.adminSection}>
                        <h3>Admin Controls</h3>

                        {!rawDate || config.processed ? (
                            <div className={Style.inputGroup}>
                                <input
                                    type="datetime-local"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className={Style.dateInput}
                                />
                                <button onClick={handleSchedule} className={Style.scheduleBtn}>
                                    Schedule Draft
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleDelete} className={Style.deleteBtn}>
                                Cancel Scheduled Draft
                            </button>
                        )}

                        <button onClick={handleOpenNow} className={Style.openNowBtn}>
                            Open Draft Now (Manual)
                        </button>
                    </div>
                )}

                {!isAdmin && (
                    <div className={Style.userNote}>
                        <p>Please be ready 10 minutes before the draft starts.</p>
                        <p>The first-round order will be drawn randomly when the draft starts, followed by snake rounds.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DraftLobby;
