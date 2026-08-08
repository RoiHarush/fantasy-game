import * as Dialog from "@radix-ui/react-dialog";
import Style from "../../../Styles/IRSignModal.module.css";
import { useSignIrPlayer } from "../../../features/transfer-window/useTransferWindow";

export default function IRSignModal({ player, user, onClose }) {
    const signPlayer = useSignIrPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        onSuccess: onClose,
    });

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
            <Dialog.Overlay className={Style.overlay} />
            <Dialog.Content className={Style.modal}>
                <Dialog.Title>Confirm Signing</Dialog.Title>
                <Dialog.Description>
                    Do you want to sign <strong>{player.viewName}</strong>{" "}
                    to replace your injured player?
                </Dialog.Description>

                <div className={Style.actions}>
                    <button type="button" className={Style.confirm} onClick={() => signPlayer.mutate(player.id)} disabled={signPlayer.isPending}>
                        {signPlayer.isPending ? "Signing…" : "Confirm"}
                    </button>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.cancel} disabled={signPlayer.isPending}>Cancel</button>
                    </Dialog.Close>
                </div>
                {signPlayer.error && <p role="alert">{signPlayer.error.message || "Error signing IR player"}</p>}
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
