import { useState } from "react";
import ConfirmFirstPickCaptainModal from "./ConfirmFirstPickCaptainModal";
import { getUnsavedSquadActionReason, isFirstPickStarting } from "../../../../features/pick-team/model";
import { useFirstPickCaptain } from "../../../../features/pick-team/usePickTeamActions";
import ChipCard from "../ChipCard";
import { showChipError } from "../chipFeedback";

function FirstPickManager({
    userId,
    gameweekId,
    squad,
    setSquad,
    chips,
    setChips,
    players,
    hasUnsavedChanges = false,
    squadSavePending = false,
}) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isActive = chips.active?.FIRST_PICK_CAPTAIN === true;
    const isUsedUp = chips.remaining?.FIRST_PICK_CAPTAIN <= 0;
    const tripleCaptainActive = chips.active?.TRIPLE_CAPTAIN === true;

    const isFirstPickInStarting = isFirstPickStarting(squad);
    const firstPickPlayer = players.find((item) => String(item.id) === String(squad.firstPickId));
    const unavailableReason = getFirstPickCaptainUnavailableReason({
        isActive,
        isUsedUp,
        tripleCaptainActive,
        firstPickId: squad.firstPickId,
        firstPickName: firstPickPlayer?.viewName,
        isFirstPickInStarting,
        hasUnsavedChanges,
        squadSavePending,
    });

    const handleToggle = () => setShowConfirmModal(true);

    const chipMutation = useFirstPickCaptain({
        userId,
        gameweekId,
        active: isActive,
        onSuccess: ({ updatedSquad, updatedChips }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
        },
        onError: (error) => showChipError(error, "Could not update First Pick Captain."),
        onSettled: () => {
            setShowConfirmModal(false);
        },
    });

    return (
        <>
            <ChipCard
                icon="/Icons/fpcaptain-chip.svg"
                iconAlt="First Pick Captain chip"
                title="First Pick Captain"
                actionLabel={isActive
                    ? "Active"
                    : unavailableReason ? "Unavailable" : "Play"}
                onAction={handleToggle}
                disabled={Boolean(unavailableReason)}
                active={isActive}
                actionTitle={unavailableReason || undefined}
                message={unavailableReason}
                remaining={chips.remaining?.FIRST_PICK_CAPTAIN ?? 0}
                total={1}
            />

            {showConfirmModal && (
                <ConfirmFirstPickCaptainModal
                    player={firstPickPlayer}
                    onConfirm={() => chipMutation.mutate()}
                    onCancel={() => setShowConfirmModal(false)}
                    isActive={isActive}
                    pending={chipMutation.isPending}
                />
            )}
        </>
    );
}

export function getFirstPickCaptainUnavailableReason({
    isActive,
    isUsedUp,
    tripleCaptainActive,
    firstPickId,
    firstPickName,
    isFirstPickInStarting,
    hasUnsavedChanges = false,
    squadSavePending = false,
}) {
    const pendingSquadReason = getUnsavedSquadActionReason(hasUnsavedChanges, squadSavePending);
    if (pendingSquadReason) return pendingSquadReason;
    if (isActive) return "";
    if (isUsedUp) return "No First Pick Captain uses remain.";
    if (tripleCaptainActive) return "Unavailable while Triple Captain is active.";
    if (firstPickId == null) return "Your original first-pick player is no longer in the squad.";
    if (!isFirstPickInStarting) {
        return `Move ${firstPickName || "your first-pick player"} into the starting XI to use this chip.`;
    }
    return "";
}

export default FirstPickManager;
