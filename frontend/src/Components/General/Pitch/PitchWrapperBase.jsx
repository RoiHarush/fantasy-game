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

                {squad && (
                    <section className={style.irSlotContainer} aria-label="Injured reserve slot">
                        <div className={style.irLabel}>IR Slot</div>
                        {irPlayer ? (
                            <div className={style.irCard}>
                                <PlayerKit
                                    teamId={irPlayer.teamId}
                                    type={irPlayer.position === "GK" ? "gk" : "field"}
                                    className={style["player-shirt"]}
                                />
                                <span className={style.irName}>{irPlayer.viewName}</span>
                                <span className={style.irPosition}>{irPlayer.position}</span>
                            </div>
                        ) : (
                            <div className={style.irCardEmpty}>
                                <Image
                                    src="/Kits/0.webp"
                                    alt=""
                                    width={40}
                                    height={50}
                                    className={style.irEmptyImg}
                                />
                                <span className={style.irName}>Empty slot</span>
                            </div>
                        )}
                    </section>
                )}

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
        </div>
    );
}

export default PitchWrapperBase;
