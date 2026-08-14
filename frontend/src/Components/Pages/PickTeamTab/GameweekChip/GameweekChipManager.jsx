import { useState } from "react";

import { getGameweekChipUnavailableReason } from "../../../../features/pick-team/model";
import { useGameweekChip } from "../../../../features/pick-team/usePickTeamActions";
import ChipCard from "../ChipCard";
import { showChipError } from "../chipFeedback";
import ConfirmGameweekChipModal from "./ConfirmGameweekChipModal";

function GameweekChipManager({
    userId,
    gameweekId,
    setSquad,
    chips,
    setChips,
    chipName,
    chipSlug,
    title,
    icon,
    description,
    disabledReason = "",
    hasUnsavedChanges = false,
    squadSavePending = false,
}) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const isActive = chips.active?.[chipName] === true;
    const displayedReason = getGameweekChipUnavailableReason({
        title,
        isActive,
        remaining: chips.remaining?.[chipName],
        disabledReason,
        hasUnsavedChanges,
        savePending: squadSavePending,
    });
    const isBlocked = Boolean(displayedReason);

    const mutation = useGameweekChip({
        userId,
        gameweekId,
        chipSlug,
        active: isActive,
        onSuccess: ({ updatedSquad, updatedChips }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
        },
        onError: (error) => showChipError(error, `Could not update ${title}.`),
        onSettled: () => setShowConfirmModal(false),
    });

    return (
        <>
            <ChipCard
                icon={icon}
                title={title}
                actionLabel={isActive ? "Active" : isBlocked ? "Unavailable" : "Play"}
                onAction={() => setShowConfirmModal(true)}
                disabled={isBlocked}
                active={isActive}
                actionTitle={displayedReason || undefined}
                message={displayedReason}
                remaining={chips.remaining?.[chipName] ?? 0}
                total={1}
            />

            {showConfirmModal && (
                <ConfirmGameweekChipModal
                    title={title}
                    icon={icon}
                    description={description}
                    active={isActive}
                    pending={mutation.isPending}
                    onConfirm={() => mutation.mutate()}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </>
    );
}

export default GameweekChipManager;
