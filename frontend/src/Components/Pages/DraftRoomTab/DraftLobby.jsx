import { useState } from "react";

import { useDraftAction } from "../../../features/draft/useDraft";
import { validateTransferOrder } from "../../../features/transfer-window/model";
import DraftLobbyView from "./DraftLobbyView";

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

    const handleManualPickChange = (index, value) => {
        const nextOrder = [...manualPicks];
        nextOrder[index] = value;
        setManualOrder(nextOrder);
        setOrderError("");
    };

    const rawDate = config?.scheduledTime || config?.scheduled_time;

    return (
        <DraftLobbyView
            isAdmin={isAdmin}
            supplementalDraft={supplementalDraft}
            league={league}
            users={users}
            rawDate={rawDate}
            hasScheduledDraft={Boolean(rawDate && !config?.processed)}
            scheduledTime={scheduledTime}
            orderSource={orderSource}
            manualPicks={manualPicks}
            orderError={orderError}
            actionError={draftAction.error}
            actionPending={draftAction.isPending}
            pendingAction={pendingAction}
            copied={copied}
            copyError={copyError}
            onScheduledTimeChange={setScheduledTime}
            onOrderSourceChange={(value) => {
                setOrderSource(value);
                setOrderError("");
            }}
            onManualPickChange={handleManualPickChange}
            onSchedule={handleSchedule}
            onPendingAction={setPendingAction}
            onConfirmationOpenChange={(open) => !open && setPendingAction(null)}
            onConfirmedAction={handleConfirmedAction}
            onCopyCode={handleCopyCode}
            onDraftTimeElapsed={onDraftTimeElapsed}
        />
    );
}

export default DraftLobby;
