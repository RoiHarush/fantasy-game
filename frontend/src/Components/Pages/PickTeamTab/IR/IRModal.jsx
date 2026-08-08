import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Style from "../../../../Styles/IRModal.module.css";
import PlayerKit from "../../../General/PlayerKit";

function IRModal({ squad, players, onClose, onSelect }) {
    const eligiblePlayers = Object.values(squad.startingLineup)
        .flat()
        .concat(Object.values(squad.bench))
        .map((id) => players.find((player) => String(player.id) === String(id)))
        .filter(Boolean);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
            <Dialog.Overlay className={Style.modalBackdrop} />
            <Dialog.Content className={`${Style.modal} fixed left-1/2 top-1/2 z-[3001] -translate-x-1/2 -translate-y-1/2`}>
                <Dialog.Title className="sr-only">Select Player for IR</Dialog.Title>
                <Dialog.Close asChild><button type="button" className={Style.closeBtn} aria-label="Close">✕</button></Dialog.Close>


                <Image src="/Icons/ir-chip.svg" alt="IR Chip" width={70} height={70} style={{ marginBottom: 16 }} />

                <h2 className={Style.title}>Select Player for IR</h2>

                {eligiblePlayers.length === 0 ? (
                    <p className={Style.notice}>No players available for IR.</p>
                ) : (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div className={Style.playerList}>
                            {eligiblePlayers.map((p) => (
                                <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className={Style.playerButton}
                                >
                                    <div className={Style.playerInfo}>
                                        <PlayerKit
                                            teamId={p.teamId}
                                            type={p.position === "GK" ? "gk" : "field"}
                                            className={Style["player-shirt"]}
                                        />
                                        <span className={Style.playerName}>{p.viewName}</span>
                                    </div>
                                    <span className={Style.playerPosition}>{p.position}</span>
                                </button>
                            ))}
                        </div>

                    </div>
                )}
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default IRModal;
