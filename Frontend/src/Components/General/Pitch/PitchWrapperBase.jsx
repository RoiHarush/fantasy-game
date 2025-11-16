import { useState } from "react";
import style from "../../../Styles/PitchWrapper.module.css"
import Pitch from "./Pitch"
import Switcher from "../Switcher"
import { usePlayers } from "../../../Context/PlayersContext";
import PlayerKit from "../PlayerKit";

function PitchWrapperBase({
    squad,
    view,
    currentGw,
    playerData,
    block,
    gwControl
}) {
    const [activeButton, setActiveButton] = useState("Pitch View");
    const { players } = usePlayers();

    return (
        <div className={style.pitchContainer}>
            <div className={style.pitchWrapper}>
                <div className={style.topArea}>
                    <img
                        src="/UI/pattern-2.png"
                        alt="pattern"
                        className={style.pattern}
                    />

                    <div>
                        {view === "points" && gwControl}
                    </div>

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
                        />
                    </div>
                ) : (
                    <div className={style.listView}>
                        <p>List View (soon...)</p>
                    </div>
                )}
            </div>

            {squad && (
                <div className={style.irSlotContainer}>
                    {squad.irId ? (
                        (() => {
                            const irPlayer = players.find(
                                (p) => p.id === squad.irId
                            );
                            if (!irPlayer) return null;
                            return (
                                <div className={style.irCard}>
                                    <PlayerKit
                                        teamId={irPlayer.teamId}
                                        type={irPlayer.position === "GK" ? "gk" : "field"}
                                        className={style["player-shirt"]}
                                    />
                                    <span className={style.irName}>
                                        {irPlayer.viewName}
                                    </span>
                                </div>
                            );
                        })()
                    ) : (
                        <div className={style.irCardEmpty}>
                            <img
                                src="/Kits/0.webp"
                                alt="Empty IR slot"
                                className={style.irEmptyImg}
                            />
                            <span className={style.irName}>Empty IR Slot</span>
                        </div>
                    )}
                    <div className={style.irLabel}>IR</div>
                </div>
            )}
        </div>
    );
}

export default PitchWrapperBase;