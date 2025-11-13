import { useEffect } from "react";
import ReactDOM from "react-dom";
import { lockScroll, unlockScroll } from "../../../../Utils/scrollLock";
import Style from "../../../../Styles/confirmFirstPickCaptainModal.module.css";

function ConfirmIRModal({ confirmIRPlayer, onConfirm, onCancel, isActive, irPlayer }) {
    useEffect(() => {
        lockScroll();
        return () => unlockScroll();
    }, []);

    if (!confirmIRPlayer) return null;

    const modalContent = (
        <div className={Style.modalBackdrop} onClick={onCancel}>
            <div className={Style.modal} onClick={(e) => e.stopPropagation()}>
                <button
                    className={Style.closeBtn}
                    onClick={() => {
                        unlockScroll();
                        onCancel();
                    }}
                >
                    ✕
                </button>

                <img
                    src="/Icons/ir-chip.svg"
                    alt="IR Chip"
                    style={{ width: 70, marginBottom: 16 }}
                />

                <h2 className={Style.title}>IR Chip</h2>

                <p className={Style.message}>
                    {isActive ? (
                        <>
                            Are you sure you want to <strong>remove {confirmIRPlayer.viewName}</strong>{" "}
                            from your squad in order to return{" "}
                            <strong>{irPlayer?.viewName || "your IR player"}</strong> back to play?
                        </>
                    ) : (
                        <>
                            <strong>{confirmIRPlayer.viewName}</strong> will be moved to your IR slot.
                        </>
                    )}
                </p>

                <p className={Style.notice}>
                    {isActive
                        ? "Confirming this will release your IR player back to your squad."
                        : "This action cannot be undone and will consume one IR chip."}
                </p>

                <div className={Style.modalButtons}>
                    <button
                        className={isActive ? Style.cancelButton : Style.confirmButton}
                        onClick={() => {
                            unlockScroll();
                            onConfirm(confirmIRPlayer);
                        }}
                    >
                        {isActive ? "Confirm Release" : "Play IR Chip"}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}

export default ConfirmIRModal;
