import { useState } from "react";
import ConfirmFirstPickCaptainModal from "./ConfirmFirstPickCaptainModal";
import style from "../../../../Styles/PickTeam.module.css";
import { isFirstPickStarting } from "../../../../features/pick-team/model";
import { useFirstPickCaptain } from "../../../../features/pick-team/usePickTeamActions";

function FirstPickManager({ userId, gameweekId, squad, setSquad, chips, setChips }) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isActive = chips.active?.FIRST_PICK_CAPTAIN === true;
    const isUsedUp = chips.remaining?.FIRST_PICK_CAPTAIN <= 0;

    const isFirstPickInStarting = isFirstPickStarting(squad);

    const handleToggle = () => setShowConfirmModal(true);

    const chipMutation = useFirstPickCaptain({
        userId,
        gameweekId,
        active: isActive,
        onSuccess: ({ updatedSquad, updatedChips }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
            alert(`Captain Chip ${isActive ? "cancelled" : "activated"} successfully!`);
        },
        onError: (error) => {
            console.error("Chip toggle failed:", error);
            alert(error.message || "Unexpected error while toggling chip");
        },
        onSettled: () => {
            setShowConfirmModal(false);
        },
    });

    return (
        <div className={style.chipCard}>
            <img
                src="/Icons/captain-chip.svg"
                alt="Captain Chip Icon"
                className={style.chipIcon}
            />
            <div className={style.chipTitle}>Captain Chip</div>

            <button
                className={`${style.chipButton} ${isActive ? style.active : ""}`}
                onClick={handleToggle}
                disabled={(!isFirstPickInStarting && !isActive) || (isUsedUp && !isActive)}
            >
                {isActive
                    ? "Active"
                    : !isFirstPickInStarting
                        ? "Unavailable"
                        : "Play"}
            </button>

            {showConfirmModal && (
                <ConfirmFirstPickCaptainModal
                    firstPickPlayerId={squad.firstPickId}
                    onConfirm={() => chipMutation.mutate()}
                    onCancel={() => setShowConfirmModal(false)}
                    isActive={isActive}
                    pending={chipMutation.isPending}
                />
            )}
        </div>
    );
}

export default FirstPickManager;
