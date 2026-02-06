import { useState } from "react";
import { AdminService } from "../../../services/adminService";
import Style from "../../../Styles/DraftLobby.module.css";

function DraftLobby({ user, isAdmin, config, onRefresh }) {
    const [scheduledTime, setScheduledTime] = useState("");

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
        await AdminService.scheduleDraft(scheduledTime);
        onRefresh();
    };

    const handleDelete = async () => {
        if (window.confirm("Delete scheduled draft?")) {
            await AdminService.deleteDraft();
            onRefresh();
        }
    };

    const handleOpenNow = async () => {
        if (window.confirm("Start Snake Draft right now?")) {
            await AdminService.openDraftNow();
            onRefresh();
        }
    };

    const rawDate = config?.scheduledTime || config?.scheduled_time;

    return (
        <div className={Style.lobbyContainer}>
            <div className={Style.card}>
                <h1 className={Style.title}>Draft Room</h1>

                {rawDate && !config.processed ? (
                    <div className={Style.scheduledBox}>
                        <p>The draft is scheduled for:</p>
                        <h2 className={Style.time}>
                            {formatDate(rawDate)}
                        </h2>
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
                        <p>Order: Reverse standings (Snake format)</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DraftLobby;