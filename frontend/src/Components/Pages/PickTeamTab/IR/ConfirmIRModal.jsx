import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Style from "../../../../Styles/ConfirmFirstPickCaptainModal.module.css";

function ConfirmIRModal({ confirmIRPlayer, onConfirm, onCancel, isActive, irPlayer, pending = false }) {
    if (!confirmIRPlayer) return null;

    return (
        <Dialog.Root open onOpenChange={open => !open && onCancel()}>
            <Dialog.Portal>
            <Dialog.Overlay className={Style.modalBackdrop} />
            <Dialog.Content className={Style.modal}>
                <Dialog.Close asChild><button type="button" className={Style.closeBtn} aria-label="Close">✕</button></Dialog.Close>

                <Image
                    src="/Icons/ir-chip.svg"
                    alt="IR Chip"
                    width={70}
                    height={70}
                    style={{ marginBottom: 16 }}
                />

                <h2 className={Style.title}>IR Chip</h2>
                <Dialog.Title className="sr-only">IR Chip confirmation</Dialog.Title>

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
                        type="button"
                        className={isActive ? Style.cancelButton : Style.confirmButton}
                        onClick={() => onConfirm(confirmIRPlayer)}
                        disabled={pending}
                    >
                        {pending ? "Saving…" : isActive ? "Confirm Release" : "Play IR Chip"}
                    </button>
                </div>
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default ConfirmIRModal;
