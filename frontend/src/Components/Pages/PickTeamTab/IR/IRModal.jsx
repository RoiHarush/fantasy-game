import { useEffect } from "react";
import Portal from "../../../../Portal";
import { lockScroll, unlockScroll } from "../../../../Utils/scrollLock";
import Style from "../../../../Styles/IRModal.module.css";
import { usePlayers } from "../../../../Context/PlayersContext";
import PlayerKit from "../../../General/PlayerKit";

function IRModal({ squad, setShowIRModal, setConfirmIRPlayer }) {
    const { players } = usePlayers();

    const eligiblePlayers = Object.values(squad.startingLineup)
        .flat()
        .concat(Object.values(squad.bench))
        .map((id) => players.find((p) => p.id === id))
        .filter(Boolean);

    useEffect(() => {
        lockScroll();
        return () => unlockScroll();
    }, []);

    const modalContent = (
        <div className={Style.modalBackdrop} onClick={() => {
            unlockScroll();
            setShowIRModal(false);
        }}>
            <div className={Style.modal} onClick={(e) => e.stopPropagation()}>
                <button
                    className={Style.closeBtn}
                    onClick={() => {
                        unlockScroll();
                        setShowIRModal(false);
                    }}
                >
                    ✕
                </button>


                <img src="/Icons/ir-chip.svg" alt="IR Chip" style={{ width: 70, marginBottom: 16 }} />

                <h2 className={Style.title}>Select Player for IR</h2>

                {eligiblePlayers.length === 0 ? (
                    <p className={Style.notice}>No players available for IR.</p>
                ) : (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div className={Style.playerList}>
                            {eligiblePlayers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setConfirmIRPlayer(p)}
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
            </div>
        </div>
    );

    return <Portal>{modalContent}</Portal>;
}

export default IRModal;
