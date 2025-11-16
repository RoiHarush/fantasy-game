import { useEffect } from "react";
import ReactDOM from "react-dom";
import Style from "../../../../Styles/IRReleaseModal.module.css";
import PlayerKit from "../../../General/PlayerKit";

function IRReleaseModal({ squad, players, irPlayer, onClose, onConfirm }) {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = "auto";
        };
    }, []);

    if (!irPlayer) return null;

    const samePositionPlayers = Object.values(squad.startingLineup)
        .flat()
        .concat(Object.values(squad.bench))
        .map((id) => players.find(p => p.id === id))
        .filter(p => p && p.position === irPlayer.position && p.id !== irPlayer.id);

    return ReactDOM.createPortal(
        <div className={Style.modalBackdrop} onClick={onClose}>
            <div className={Style.modal} onClick={(e) => e.stopPropagation()}>
                <button className={Style.closeBtn} onClick={onClose}>✕</button>

                <img
                    src="/Icons/ir-chip.svg"
                    alt="IR Chip"
                    className={Style.chipIconLarge}
                />

                <h2 className={Style.title}>Release IR Player</h2>

                <p className={Style.message}>
                    Select a player <strong>to remove</strong> from your squad in order to return{" "}
                    <strong>{irPlayer.viewName}</strong> from IR.
                </p>

                {samePositionPlayers.length === 0 ? (
                    <p className={Style.notice}>No available players of the same position.</p>
                ) : (
                    <div className={Style.playerList}>
                        {samePositionPlayers.map(p => (
                            <button
                                key={p.id}
                                className={Style.playerButton}
                                onClick={() => {
                                    onConfirm?.(p);
                                    onClose();
                                }}
                            >
                                <div className={Style.playerInfo}>
                                    <PlayerKit
                                        teamId={p.teamId}
                                        type={p.position === "GK" ? "gk" : "field"}
                                        className={Style.playerShirt}
                                    />
                                    <span className={Style.playerName}>{p.viewName}</span>
                                </div>
                                <span className={Style.playerTeam}>{p.teamName}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className={Style.modalButtons}>
                    <button className={Style.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default IRReleaseModal;
