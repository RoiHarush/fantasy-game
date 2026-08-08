import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Style from "../../../../Styles/ConfirmFirstPickCaptainModal.module.css";

function ConfirmFirstPickCaptainModal({ player, onConfirm, onCancel, isActive, pending = false }) {
    if (!player) return null;

    return (
        <Dialog.Root open onOpenChange={open => !open && onCancel()}>
            <Dialog.Portal>
            <Dialog.Overlay className={Style.modalBackdrop} />
            <Dialog.Content className={`${Style.modal} fixed left-1/2 top-1/2 z-[3001] -translate-x-1/2 -translate-y-1/2`} aria-labelledby="captain-chip-title">
                <Dialog.Close asChild><button type="button" className={Style.closeBtn} aria-label="Close captain chip dialog">✕</button></Dialog.Close>

                <Image
                    src="/Icons/captain-chip.svg"
                    alt="Captain Chip"
                    width={70}
                    height={70}
                    style={{ marginBottom: 16 }}
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
                        disabled={pending}
                    >
                        {pending ? "Saving…" : isActive ? "Cancel Chip" : "Play Chip"}
                    </button>
                </div>
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default ConfirmFirstPickCaptainModal;
