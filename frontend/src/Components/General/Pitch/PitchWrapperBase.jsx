import Image from "next/image";
import { useState } from "react";

import style from "../../../Styles/PitchWrapper.module.css";
import PlayerKit from "../PlayerKit";
import Switcher from "../Switcher";
import Pitch from "./Pitch";

function PitchWrapperBase({
    squad,
    view,
    currentGw,
    playerData,
    players,
    block,
    gwControl
}) {
    const [activeButton, setActiveButton] = useState("Pitch View");
    const [isIROpen, setIsIROpen] = useState(false);
    const irPlayer = squad?.irId
        ? players.find((player) => String(player.id) === String(squad.irId))
        : null;

    return (
        <div className={style.pitchContainer}>
            <div className={style.pitchWrapper}>
                <div className={style.topArea}>
                    <Image
                        src="/UI/pattern-2.png"
                        alt=""
                        width={900}
                        height={220}
                        className={style.pattern}
                    />
                    <div>{view === "points" && gwControl}</div>
                    <div className={style.block}>{block}</div>
                    <div className={style.fade}></div>
                </div>

                <div className={style.viewButtons}>
                    <Switcher
                        active={activeButton}
                        options={["Pitch View", "List View"]}
                        onChange={setActiveButton}
                    />
                </div>

                {activeButton === "Pitch View" ? (
                    <div className={style.pitchM}>
                        <Pitch
                            squad={squad}
                            view={view}
                            currentGw={currentGw}
                            playerData={playerData}
                            players={players}
                        />
                    </div>
                ) : (
                    <div className={style.listView}>
                        <p>List View (soon...)</p>
                    </div>
                )}
            </div>

            {squad && (
                <>
                    <button
                        type="button"
                        className={`${style.irToggleBtn} ${isIROpen ? style.hidden : ''}`}
                        onClick={() => setIsIROpen(true)}
                    >
                        IR {irPlayer ? "(!)" : ""}
                    </button>

                    {isIROpen && (
                        <button type="button" aria-label="Close IR panel" className={style.backdrop} onClick={() => setIsIROpen(false)} />
                    )}

                    <div className={`${style.irSlotContainer} ${isIROpen ? style.irSlotOpen : ''}`}>

                        <button type="button" className={style.closeIrBtn} onClick={() => setIsIROpen(false)} aria-label="Close IR panel">✕</button>

                        {irPlayer ? (
                            <div className={style.irCard}>
                                <PlayerKit
                                    teamId={irPlayer.teamId}
                                    type={irPlayer.position === "GK" ? "gk" : "field"}
                                    className={style["player-shirt"]}
                                />
                                <span className={style.irName}>{irPlayer.viewName}</span>
                            </div>
                        ) : (
                            <div className={style.irCardEmpty}>
                                <Image
                                    src="/Kits/0.webp"
                                    alt="Empty IR slot"
                                    width={80}
                                    height={100}
                                    className={style.irEmptyImg}
                                />
                                <span className={style.irName}>Empty</span>
                            </div>
                        )}
                        <div className={style.irLabel}>IR SLOT</div>
                    </div>
                </>
            )}
        </div>
    );
}

export default PitchWrapperBase;
