import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRightLeft, Crown, Info, ShieldCheck, X } from "lucide-react";
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
        firstPickUsed && String(squad?.firstPickId) === String(player.id);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
            <Dialog.Overlay className={Style.overlay} />
            <Dialog.Content className={Style.modal}>
                <div className={Style.header}>
                    <div>
                        <span className={Style.eyebrow}>Player actions</span>
                        <Dialog.Title className={Style.playerName}>
                            {`${player.firstName} ${player.lastName}`}
                        </Dialog.Title>
                    </div>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.closeBtn} aria-label="Close player actions">
                            <X aria-hidden="true" size={20} />
                        </button>
                    </Dialog.Close>
                </div>

                <div className={Style.body}>
                    <button
                        type="button"
                        className={`${Style.switchBtn} ${isLockedFirstPickCaptain ? Style.disabledLabel : ""}`}
                        onClick={() => onSwitch(player.id)}
                        disabled={isLockedFirstPickCaptain}
                    >
                        <span className={Style.actionIcon}><ArrowRightLeft aria-hidden="true" size={20} /></span>
                        <span className={Style.actionCopy}>
                            <strong>Switch player</strong>
                            <small>Choose a valid squad replacement</small>
                        </span>
                    </button>

                    <div className={Style.roleGrid}>
                        <label className={`${Style.roleOption} ${isCaptain ? Style.roleSelected : ""} ${!canBeCaptain || firstPickUsed ? Style.disabledLabel : ""}`}>
                            <input
                                type="checkbox"
                                className={Style.roleInput}
                                checked={isCaptain}
                                onChange={() => onSetCaptain(player.id)}
                                disabled={!canBeCaptain || firstPickUsed}
                            />
                            <Crown aria-hidden="true" size={20} />
                            <span>
                                <strong>Captain</strong>
                                <small>Double points</small>
                            </span>
                        </label>

                        <label className={`${Style.roleOption} ${isVice ? Style.roleSelected : ""} ${!canBeCaptain ? Style.disabledLabel : ""}`}>
                            <input
                                type="checkbox"
                                className={Style.roleInput}
                                checked={isVice}
                                onChange={() => onSetVice(player.id)}
                                disabled={!canBeCaptain}
                            />
                            <ShieldCheck aria-hidden="true" size={20} />
                            <span>
                                <strong>Vice</strong>
                                <small>Captain backup</small>
                            </span>
                        </label>
                    </div>

                    <button type="button" className={Style.infoBtn} onClick={() => onViewInfo(player)}>
                        <Info aria-hidden="true" size={20} />
                        <span>View player information</span>
                    </button>

                </div>
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default PlayerActionModal;
