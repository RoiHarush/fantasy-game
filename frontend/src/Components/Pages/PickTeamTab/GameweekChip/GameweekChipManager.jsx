import { useState } from "react";

import { useGameweekChip } from "../../../../features/pick-team/usePickTeamActions";
import ChipCard from "../ChipCard";
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
}) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [message, setMessage] = useState("");
    const isActive = chips.active?.[chipName] === true;
    const isUsedUp = (chips.remaining?.[chipName] ?? 0) <= 0;
    const isBlocked = !isActive && (isUsedUp || Boolean(disabledReason));

    const mutation = useGameweekChip({
        userId,
        gameweekId,
        chipSlug,
        active: isActive,
        onSuccess: ({ updatedSquad, updatedChips }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
            setMessage(`${title} ${isActive ? "cancelled" : "activated"} successfully.`);
        },
        onError: (error) => setMessage(error.message || `Could not update ${title}.`),
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
                actionTitle={disabledReason || undefined}
                message={message || (!isActive ? disabledReason : "")}
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
