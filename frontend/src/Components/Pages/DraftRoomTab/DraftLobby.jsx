import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useDraftAction } from "../../../features/draft/useDraft";
import { validateTransferOrder } from "../../../features/transfer-window/model";
import { formatAppDateTime } from "../../../lib/dateTime";
import { Button } from "../../../shared/ui/Button";
import Style from "../../../Styles/DraftLobby.module.css";
import DraftCountdown from "./DraftCountdown";

function DraftLobby({ isAdmin, config, league, users = [], onDraftTimeElapsed }) {
    const [scheduledTime, setScheduledTime] = useState("");
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");
    const [pendingAction, setPendingAction] = useState(null);
    const [orderSource, setOrderSource] = useState("TRANSFER_ORDER");
    const [manualOrder, setManualOrder] = useState([]);
    const [orderError, setOrderError] = useState("");
    const draftAction = useDraftAction(league?.id, {
        onSuccess: (_result, action) => {
            if (action.type === "schedule") setScheduledTime("");
            setPendingAction(null);
        },
    });

    const supplementalDraft = league?.status === "ACTIVE";
    const pickCount = users.length * 2;
    const manualPicks = Array.from({ length: pickCount }, (_, index) => (
        manualOrder[index] == null ? "" : String(manualOrder[index])
    ));

    const getDraftOrder = () => {
        if (!supplementalDraft || orderSource !== "MANUAL") {
            setOrderError("");
            return { orderSource: "TRANSFER_ORDER", order: [] };
        }
        const cleanOrder = manualPicks.filter(Boolean).map(Number);
        const error = validateTransferOrder(cleanOrder, users.map(user => user.id));
        if (error) {
            setOrderError(error);
            return null;
        }
        setOrderError("");
        return { orderSource: "MANUAL", order: cleanOrder };
    };

    const handleSchedule = () => {
        if (!scheduledTime) return;
        const orderOptions = getDraftOrder();
        if (!orderOptions) return;
        draftAction.mutate({ type: "schedule", time: scheduledTime, ...orderOptions });
    };

    const handleConfirmedAction = () => {
        if (!pendingAction) return;
        if (pendingAction === "open") {
            const orderOptions = getDraftOrder();
            if (!orderOptions) return;
            draftAction.mutate({ type: pendingAction, ...orderOptions });
            return;
        }
        draftAction.mutate({ type: pendingAction });
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(league.leagueCode);
            setCopied(true);
            setCopyError("");
        } catch {
            setCopyError("The league code could not be copied. Please copy it manually.");
        }
    };

    const rawDate = config?.scheduledTime || config?.scheduled_time;

    return (
        <div className={Style.lobbyContainer}>
            <div className={Style.card}>
                <h1 className={Style.title}>{supplementalDraft ? "Supplemental Draft Room" : "Draft Room"}</h1>

                {draftAction.error && <p role="alert" style={{ color: "#b42318" }}>{draftAction.error.message}</p>}

                {league?.leagueCode && (
                    <div className={Style.scheduledBox}>
                        <p>Share this league code with your friends</p>
                        <h2 className={Style.time}>{league.leagueCode}</h2>
                        <button type="button" onClick={handleCopyCode}>
                            {copied ? "Copied!" : "Copy code"}
                        </button>
                        {copyError && <p role="alert">{copyError}</p>}
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
                            {formatAppDateTime(rawDate) || "Invalid date"}
                        </h2>
                        <strong>
                            <DraftCountdown value={rawDate} onElapsed={onDraftTimeElapsed} />
                        </strong>
                    </div>
                ) : (
                    <div className={Style.noDraft}>
                        <p>No draft scheduled at the moment.</p>
                    </div>
                )}

                {isAdmin && (
                    <div className={Style.adminSection}>
                        <h3>Admin Controls</h3>

                        {supplementalDraft && (
                            <div className={Style.inputGroup}>
                                <label htmlFor="supplemental-order-source">Draft order</label>
                                <select
                                    id="supplemental-order-source"
                                    value={orderSource}
                                    onChange={(event) => {
                                        setOrderSource(event.target.value);
                                        setOrderError("");
                                    }}
                                    className={Style.dateInput}
                                >
                                    <option value="TRANSFER_ORDER">Use upcoming transfer-window order</option>
                                    <option value="MANUAL">Set order manually</option>
                                </select>
                            </div>
                        )}

                        {supplementalDraft && orderSource === "MANUAL" && (
                            <div className="my-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-white/15 p-3">
                                {manualPicks.map((selectedUserId, index) => (
                                    <label key={index} className="flex items-center gap-3">
                                        <span className="w-16">Pick {index + 1}</span>
                                        <select
                                            value={selectedUserId}
                                            onChange={(event) => {
                                                const nextOrder = [...manualPicks];
                                                nextOrder[index] = event.target.value;
                                                setManualOrder(nextOrder);
                                                setOrderError("");
                                            }}
                                            className={Style.dateInput}
                                        >
                                            <option value="">Select manager</option>
                                            {users.map(manager => (
                                                <option key={manager.id} value={manager.id}>{manager.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                ))}
                            </div>
                        )}
                        {orderError && <p role="alert" style={{ color: "#b42318" }}>{orderError}</p>}

                        {!rawDate || config.processed ? (
                            <div className={Style.inputGroup}>
                                <label className="sr-only" htmlFor="draft-scheduled-time">Draft date and time</label>
                                <input
                                    id="draft-scheduled-time"
                                    type="datetime-local"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className={Style.dateInput}
                                />
                                <button type="button" onClick={handleSchedule} className={Style.scheduleBtn} disabled={draftAction.isPending || !scheduledTime}>
                                    Schedule {supplementalDraft ? "Supplemental Draft" : "Draft"}
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setPendingAction("delete")} className={Style.deleteBtn} disabled={draftAction.isPending}>
                                Cancel Scheduled Draft
                            </button>
                        )}

                        <button type="button" onClick={() => setPendingAction("open")} className={Style.openNowBtn} disabled={draftAction.isPending}>
                            Open Draft Now (Manual)
                        </button>
                    </div>
                )}

                {!isAdmin && (
                    <div className={Style.userNote}>
                        <p>Please be ready 10 minutes before the draft starts.</p>
                        <p>
                            {supplementalDraft
                                ? "The supplemental draft has two picks per manager. Each turn can be passed or used to replace a squad player with a newly arrived player."
                                : "The first-round order will be drawn randomly when the draft starts, followed by snake rounds."}
                        </p>
                    </div>
                )}
            </div>

            <Dialog.Root open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,25rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900 p-7 text-center text-white shadow-2xl focus:outline-none">
                        <Dialog.Title className="text-xl font-bold">
                            {pendingAction === "open" ? "Open the draft now?" : "Cancel the scheduled draft?"}
                        </Dialog.Title>
                        <Dialog.Description className="mt-3 text-slate-300">
                            {pendingAction === "open"
                                ? "This starts the snake draft immediately for every league manager."
                                : "The current draft date will be removed for every league manager."}
                        </Dialog.Description>
                        <div className="mt-6 flex justify-center gap-3">
                            <Dialog.Close asChild>
                                <Button variant="ghost" className="text-white" disabled={draftAction.isPending}>Back</Button>
                            </Dialog.Close>
                            <Button
                                variant={pendingAction === "open" ? "danger" : "secondary"}
                                onClick={handleConfirmedAction}
                                disabled={draftAction.isPending}
                            >
                                {draftAction.isPending ? "Saving…" : "Confirm"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

export default DraftLobby;
