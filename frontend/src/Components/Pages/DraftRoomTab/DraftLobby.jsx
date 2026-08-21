import { useState } from "react";

import { useDraftAction } from "../../../features/draft/useDraft";
import {
    findActiveGameweek,
    findGameweekScheduleConflict,
    gameweekLabel,
} from "../../../features/gameweeks/availability";
import { validateDraftOrder } from "../../../features/draft/model";
import DraftLobbyView from "./DraftLobbyView";

function DraftLobby({
    isAdmin,
    config,
    league,
    users = [],
    gameweeks = [],
    currentGameweek = null,
    onDraftTimeElapsed,
    readOnly = false,
}) {
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
    const activeGameweek = findActiveGameweek(gameweeks, currentGameweek);
    const scheduleConflict = findGameweekScheduleConflict(gameweeks, scheduledTime);
    const configuredScheduleConflict = findGameweekScheduleConflict(
        gameweeks,
        config?.scheduledTime || config?.scheduled_time,
    );
    const openBlockedReason = activeGameweek
        ? `Drafts cannot open while ${gameweekLabel(activeGameweek)} is active.`
        : "";
    const scheduleBlockedReason = scheduleConflict
        ? `Choose a time outside ${gameweekLabel(scheduleConflict)}.`
        : "";
    const rawDate = config?.scheduledTime || config?.scheduled_time;
    const hasScheduledDraft = Boolean(rawDate && !config?.processed);
    const configuredOrderSource = config?.orderSource ?? config?.order_source ?? "TRANSFER_ORDER";
    const configuredManualOrder = config?.manualOrder ?? config?.manual_order ?? [];
    const effectiveOrderSource = hasScheduledDraft ? configuredOrderSource : orderSource;
    const effectiveManualOrder = hasScheduledDraft ? configuredManualOrder : manualOrder;
    const draftRoundCount = supplementalDraft ? 2 : 1;
    const pickCount = users.length * draftRoundCount;
    const manualPicks = Array.from({ length: pickCount }, (_, index) => (
        effectiveManualOrder[index] == null ? "" : String(effectiveManualOrder[index])
    ));

    const getDraftOrder = () => {
        if (effectiveOrderSource !== "MANUAL") {
            setOrderError("");
            return { orderSource: "TRANSFER_ORDER", order: [] };
        }

        const cleanOrder = manualPicks.filter(Boolean).map(Number);
        const error = validateDraftOrder(
            cleanOrder,
            users.map(user => user.id),
            draftRoundCount,
        );
        if (error) {
            setOrderError(error);
            return null;
        }

        setOrderError("");
        return { orderSource: "MANUAL", order: cleanOrder };
    };

    const handleSchedule = () => {
        if (readOnly) return;
        if (!scheduledTime || scheduleBlockedReason) return;
        const orderOptions = getDraftOrder();
        if (!orderOptions) return;
        draftAction.mutate({ type: "schedule", time: scheduledTime, ...orderOptions });
    };

    const handleConfirmedAction = () => {
        if (readOnly) return;
        if (!pendingAction) return;
        if (pendingAction === "open") {
            if (openBlockedReason) return;
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

    return (
        <DraftLobbyView
            isAdmin={isAdmin}
            supplementalDraft={supplementalDraft}
            league={league}
            users={users}
            rawDate={rawDate}
            hasScheduledDraft={hasScheduledDraft}
            scheduledTime={scheduledTime}
            orderSource={effectiveOrderSource}
            manualPicks={manualPicks}
            orderError={orderError}
            actionError={draftAction.error}
            actionPending={draftAction.isPending}
            openBlockedReason={openBlockedReason}
            scheduleBlockedReason={scheduleBlockedReason}
            configuredScheduleBlockedReason={configuredScheduleConflict
                ? `This draft will not open during ${gameweekLabel(configuredScheduleConflict)}. Reschedule it.`
                : ""}
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
            readOnly={readOnly}
        />
    );
}

export default DraftLobby;
