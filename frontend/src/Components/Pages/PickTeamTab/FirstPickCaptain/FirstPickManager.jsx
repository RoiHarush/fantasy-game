import Image from "next/image";
import { useState } from "react";
import ConfirmFirstPickCaptainModal from "./ConfirmFirstPickCaptainModal";
import style from "../../../../Styles/PickTeam.module.css";
import { isFirstPickStarting } from "../../../../features/pick-team/model";
import { useFirstPickCaptain } from "../../../../features/pick-team/usePickTeamActions";

function FirstPickManager({ userId, gameweekId, squad, setSquad, chips, setChips, players }) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [message, setMessage] = useState("");

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
        <div className={style.chipCard}>
            <Image
                src="/Icons/captain-chip.svg"
                alt="Captain Chip Icon"
                width={64}
                height={64}
                className={style.chipIcon}
            />
            <div className={style.chipTitle}>Captain Chip</div>

            <button
                type="button"
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

            {message && <p role="status">{message}</p>}

            {showConfirmModal && (
                <ConfirmFirstPickCaptainModal
                    player={players.find((item) => String(item.id) === String(squad.firstPickId))}
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
