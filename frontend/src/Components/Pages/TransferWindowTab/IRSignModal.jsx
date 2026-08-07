import Style from "../../../Styles/IRSignModal.module.css";
import { useSignIrPlayer } from "../../../features/transfer-window/useTransferWindow";

export default function IRSignModal({ player, user, onClose }) {
    const signPlayer = useSignIrPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        onSuccess: onClose,
    });

    return (
        <div className={Style.overlay}>
            <div className={Style.modal}>
                <h3>Confirm Signing</h3>
                <p>
                    Do you want to sign <strong>{player.viewName}</strong>
                    to replace your injured player?
                </p>

                <div className={Style.actions}>
                    <button className={Style.confirm} onClick={() => signPlayer.mutate(player.id)} disabled={signPlayer.isPending}>
                        {signPlayer.isPending ? "Signing…" : "Confirm"}
                    </button>
                    <button className={Style.cancel} onClick={onClose}>
                        Cancel
                    </button>
                </div>
                {signPlayer.error && <p role="alert">{signPlayer.error.message || "Error signing IR player"}</p>}
            </div>
        </div>
    );
}
