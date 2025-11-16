import Style from "../../Styles/PlayerActionModal.module.css";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";

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
        firstPickUsed && isCaptain && squad?.firstPickId === player.id;

    return (
        <div className={Style.overlay} onClick={onClose}>
            <div className={Style.modal} onClick={e => e.stopPropagation()}>
                <div className={Style.header}>
                    <h2 className={Style.playerName}>{player.firstName + " " + player.lastName}</h2>
                    <button className={Style.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={Style.body}>
                    <button
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

                    <button className={Style.infoBtn} onClick={() => onViewInfo(player)}>
                        View Information
                    </button>

                </div>
            </div>
        </div>
    );
}

export default PlayerActionModal;
