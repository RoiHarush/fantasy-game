import { useState } from "react";
import ConfirmFirstPickCaptainModal from "./ConfirmFirstPickCaptainModal";
import style from "../../../../Styles/PickTeam.module.css";
import { apiRequest } from "../../../../services/apiClient";

function FirstPickManager({ userId, squad, setSquad, chips, setChips }) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isActive = chips.active?.FIRST_PICK_CAPTAIN === true;
    const isUsedUp = chips.remaining?.FIRST_PICK_CAPTAIN <= 0;

    const isFirstPickInStarting = squad?.firstPickId
        ? Object.values(squad.startingLineup).flat().includes(squad.firstPickId)
        : false;

    const handleToggle = () => setShowConfirmModal(true);

    const handleConfirm = async () => {
        try {
            const endpoint = isActive
                ? `/api/teams/${userId}/chips/first-pick-captain/release`
                : `/api/teams/${userId}/chips/first-pick-captain`;

            const updatedSquad = await apiRequest(endpoint, {
                method: "POST",
            });

            setSquad(updatedSquad);

            alert(`Captain Chip ${isActive ? "cancelled" : "activated"} successfully!`);

            const updatedChips = await apiRequest(`/api/teams/${userId}/chips`);
            setChips(updatedChips);

            setShowConfirmModal(false);
        } catch (err) {
            console.error("Chip toggle failed:", err);
            alert("Unexpected error while toggling chip");
        }
    };

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
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirmModal(false)}
                    isActive={isActive}
                />
            )}
        </div>
    );
}

export default FirstPickManager;