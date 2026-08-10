import { useState } from "react";
import ConfirmFirstPickCaptainModal from "./ConfirmFirstPickCaptainModal";
import { isFirstPickStarting } from "../../../../features/pick-team/model";
import { useFirstPickCaptain } from "../../../../features/pick-team/usePickTeamActions";
import ChipCard from "../ChipCard";

function FirstPickManager({ userId, gameweekId, squad, setSquad, chips, setChips, players }) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [message, setMessage] = useState("");

    const isActive = chips.active?.FIRST_PICK_CAPTAIN === true;
    const isUsedUp = chips.remaining?.FIRST_PICK_CAPTAIN <= 0;
    const tripleCaptainActive = chips.active?.TRIPLE_CAPTAIN === true;

    const isFirstPickInStarting = isFirstPickStarting(squad);

    const handleToggle = () => setShowConfirmModal(true);

    const chipMutation = useFirstPickCaptain({
        userId,
        gameweekId,
        active: isActive,
        onSuccess: ({ updatedSquad, updatedChips }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
            setMessage(`Captain Chip ${isActive ? "cancelled" : "activated"} successfully.`);
        },
        onError: (error) => {
            setMessage(error.message || "Unexpected error while toggling chip.");
        },
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
                    : tripleCaptainActive || !isFirstPickInStarting
                        ? "Unavailable"
                        : "Play"}
                onAction={handleToggle}
                disabled={
                    (!isFirstPickInStarting && !isActive)
                    || (isUsedUp && !isActive)
                    || (tripleCaptainActive && !isActive)
                }
                active={isActive}
                message={message || (!isActive && tripleCaptainActive
                    ? "Unavailable while Triple Captain is active."
                    : "")}
            />

            {showConfirmModal && (
                <ConfirmFirstPickCaptainModal
                    player={players.find((item) => String(item.id) === String(squad.firstPickId))}
                    onConfirm={() => chipMutation.mutate()}
                    onCancel={() => setShowConfirmModal(false)}
                    isActive={isActive}
                    pending={chipMutation.isPending}
                />
            )}
        </>
    );
}

export default FirstPickManager;
