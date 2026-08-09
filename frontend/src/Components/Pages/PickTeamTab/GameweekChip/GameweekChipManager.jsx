import Image from "next/image";
import { useState } from "react";

import { useGameweekChip } from "../../../../features/pick-team/usePickTeamActions";
import style from "../../../../Styles/PickTeam.module.css";
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
        <div className={style.chipCard}>
            <Image src={icon} alt="" width={64} height={64} className={style.chipIcon} />
            <div className={style.chipTitle}>{title}</div>

            <button
                type="button"
                className={`${style.chipButton} ${isActive ? style.active : ""}`}
                onClick={() => setShowConfirmModal(true)}
                disabled={isBlocked}
                title={disabledReason || undefined}
            >
                {isActive ? "Active" : isBlocked ? "Unavailable" : "Play"}
            </button>

            {(message || (!isActive && disabledReason)) && (
                <p role="status" className={style.chipMessage}>{message || disabledReason}</p>
            )}

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
        </div>
    );
}

export default GameweekChipManager;
