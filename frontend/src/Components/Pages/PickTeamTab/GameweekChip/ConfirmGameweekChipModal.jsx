import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";

import Style from "../../../../Styles/ConfirmFirstPickCaptainModal.module.css";

function ConfirmGameweekChipModal({
    title,
    icon,
    description,
    active,
    pending = false,
    onConfirm,
    onCancel,
}) {
    const titleId = `${title.toLowerCase().replaceAll(" ", "-")}-chip-title`;

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className={Style.modalBackdrop} />
                <Dialog.Content className={Style.modal} aria-labelledby={titleId}>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.closeBtn} aria-label={`Close ${title} dialog`}>
                            ✕
                        </button>
                    </Dialog.Close>

                    <Image src={icon} alt="" width={70} height={70} style={{ marginBottom: 16 }} />
                    <h2 id={titleId} className={Style.title}>{title}</h2>
                    <p className={Style.message}>{description}</p>
                    <p className={Style.notice}>
                        You can {active ? "cancel" : "activate"} this chip anytime before the Gameweek deadline.
                    </p>

                    <div className={Style.modalButtons}>
                        <button
                            type="button"
                            className={active ? Style.cancelButton : Style.confirmButton}
                            onClick={onConfirm}
                            disabled={pending}
                        >
                            {pending ? "Saving…" : active ? "Cancel Chip" : "Play Chip"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default ConfirmGameweekChipModal;
