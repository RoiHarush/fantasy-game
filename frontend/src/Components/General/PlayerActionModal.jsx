import * as Dialog from "@radix-ui/react-dialog";
import Style from "../../Styles/PlayerActionModal.module.css";

function PlayerActionModal({
    player,
    squad,
    onClose,
    onSwitch,
    onSetCaptain,
    onSetVice,
    onViewInfo,
    isCaptain,
    isVice,
    canBeCaptain,
    firstPickUsed
}) {
    if (!player) return null;

    const isLockedFirstPickCaptain =
        firstPickUsed && isCaptain && String(squad?.firstPickId) === String(player.id);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
            <Dialog.Overlay className={Style.overlay} />
            <Dialog.Content className={Style.modal}>
                <div className={Style.header}>
                    <Dialog.Title className={Style.playerName}>
                        {`${player.firstName} ${player.lastName}`}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.closeBtn} aria-label="Close player actions">✕</button>
                    </Dialog.Close>
                </div>

                <div className={Style.body}>
                    <button
                        type="button"
                        className={`${Style.switchBtn} ${isLockedFirstPickCaptain ? Style.disabledLabel : ""}`}
                        onClick={() => onSwitch(player.id)}
                        disabled={isLockedFirstPickCaptain}
                    >
                        Switch Player
                    </button>

                    <div className={Style.checkboxRow}>
                        <label className={!canBeCaptain || firstPickUsed ? Style.disabledLabel : ""}>
                            <input
                                type="checkbox"
                                checked={isCaptain}
                                onChange={() => onSetCaptain(player.id)}
                                disabled={!canBeCaptain || firstPickUsed}
                            /> Captain
                        </label>

                        <label className={!canBeCaptain ? Style.disabledLabel : ""}>
                            <input
                                type="checkbox"
                                checked={isVice}
                                onChange={() => onSetVice(player.id)}
                                disabled={!canBeCaptain}
                            /> Vice
                        </label>
                    </div>

                    <button type="button" className={Style.infoBtn} onClick={() => onViewInfo(player)}>
                        View Information
                    </button>

                </div>
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default PlayerActionModal;
