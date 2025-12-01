import Style from "../../../Styles/IRSignModal.module.css";
import API_URL from "../../../config";
import { getAuthHeaders } from "../../../services/authHelper";

export default function IRSignModal({ player, user, onClose }) {
    const handleConfirm = async () => {
        try {
            const res = await fetch(`${API_URL}/api/market/ir-sign`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: user.id,
                    playerId: player.id
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            console.log("IR player signed successfully");
            onClose();
        } catch (err) {
            console.error("Failed to sign IR player:", err);
            alert(err.message || "Error signing IR player");
        }
    };

    return (
        <div className={Style.overlay}>
            <div className={Style.modal}>
                <h3>Confirm Signing</h3>
                <p>
                    Do you want to sign <strong>{player.viewName}</strong>
                    to replace your injured player?
                </p>

                <div className={Style.actions}>
                    <button className={Style.confirm} onClick={handleConfirm}>
                        Confirm
                    </button>
                    <button className={Style.cancel} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}