import { useEffect } from "react";
import ReactDOM from "react-dom";
import Style from "../../../../Styles/ConfirmFirstPickCaptainModal.module.css";
import { usePlayers } from "../../../../Context/PlayersContext";

function ConfirmFirstPickCaptainModal({ firstPickPlayerId, onConfirm, onCancel, isActive }) {
    const { players } = usePlayers();
    const player = players.find(p => p.id === firstPickPlayerId);
    if (!player) return null;

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = "auto";
        };
    }, []);

    const modalContent = (
        <div className={Style.modalBackdrop} onClick={onCancel}>
            <div className={Style.modal} onClick={e => e.stopPropagation()}>
                <button className={Style.closeBtn} onClick={onCancel}>✕</button>

                <img
                    src="/Icons/captain-chip.svg"
                    alt="Captain Chip"
                    style={{ width: 70, marginBottom: 16 }}
                />

                <h2 className={Style.title}>Captain Chip</h2>

                <p className={Style.message}>
                    The points scored by your <strong>first pick</strong> player (<strong>{player.viewName}</strong>)
                    will be doubled this Gameweek as your automatic captain.
                </p>

                <p className={Style.notice}>
                    You can {isActive ? "cancel" : "activate"} this chip anytime before the Gameweek deadline.
                </p>

                <div className={Style.modalButtons}>
                    <button
                        className={isActive ? Style.cancelButton : Style.confirmButton}
                        onClick={onConfirm}
                    >
                        {isActive ? "Cancel Chip" : "Play Chip"}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}

export default ConfirmFirstPickCaptainModal;
