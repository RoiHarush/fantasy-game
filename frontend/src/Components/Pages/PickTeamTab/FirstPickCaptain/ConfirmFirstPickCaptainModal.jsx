import { useEffect } from "react";
import Portal from "../../../../Portal";
import Style from "../../../../Styles/ConfirmFirstPickCaptainModal.module.css";
import { usePlayers } from "../../../../Context/PlayersContext";

function ConfirmFirstPickCaptainModal({ firstPickPlayerId, onConfirm, onCancel, isActive }) {
    const { players } = usePlayers();
    const player = players.find(p => p.id === firstPickPlayerId);

    useEffect(() => {
        if (!player) return undefined;

        const originalOverflow = document.body.style.overflow;
        const originalTouchAction = document.body.style.touchAction;
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = originalTouchAction;
        };
    }, [player]);

    if (!player) return null;

    const modalContent = (
        <div className={Style.modalBackdrop} onClick={onCancel}>
            <div className={Style.modal} role="dialog" aria-modal="true" aria-labelledby="captain-chip-title" onClick={e => e.stopPropagation()}>
                <button type="button" className={Style.closeBtn} onClick={onCancel} aria-label="Close captain chip dialog">✕</button>

                <img
                    src="/Icons/captain-chip.svg"
                    alt="Captain Chip"
                    style={{ width: 70, marginBottom: 16 }}
                />

                <h2 id="captain-chip-title" className={Style.title}>Captain Chip</h2>

                <p className={Style.message}>
                    The points scored by your <strong>first pick</strong> player (<strong>{player.viewName}</strong>)
                    will be doubled this Gameweek as your automatic captain.
                </p>

                <p className={Style.notice}>
                    You can {isActive ? "cancel" : "activate"} this chip anytime before the Gameweek deadline.
                </p>

                <div className={Style.modalButtons}>
                    <button
                        type="button"
                        className={isActive ? Style.cancelButton : Style.confirmButton}
                        onClick={onConfirm}
                    >
                        {isActive ? "Cancel Chip" : "Play Chip"}
                    </button>
                </div>
            </div>
        </div>
    );

    return <Portal>{modalContent}</Portal>;
}

export default ConfirmFirstPickCaptainModal;
