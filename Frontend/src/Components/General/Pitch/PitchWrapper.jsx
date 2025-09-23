import Style from "../../../Styles/PitchWrapper.module.css"
import { useState } from "react";
import Pitch from "./Pitch"
import Switcher from "../Switcher"

function PitchWrapper({
    squad,
    view,
    selectedPlayerId,
    disabledIds,
    onClick,
    block
}) {

    const [activeButton, setActiveButton] = useState("Pitch View");

    return (
        <div className={Style.pitchWrapper}>
            <div className={Style.topArea}>
                <img src="/UI/pattern-2.png" alt="very beautiful pattern" className={Style.pattern} />
                <div className={Style.block}>
                    {block}
                </div>
                <div className={Style.fade}></div>
            </div>

            <div className={Style.viewButtons}>
                <Switcher
                    active={activeButton}
                    options={["Pitch View", "List View"]}
                    onChange={setActiveButton}
                />
            </div>


            {activeButton === "Pitch View" ? (
                <div className={Style.pitchM}>
                    <Pitch
                        squad={squad}
                        view={view}
                        selectedPlayerId={selectedPlayerId}
                        disabledIds={disabledIds}
                        onClick={onClick}
                    />
                </div>

            ) : (
                <div className={Style.listView}>
                    <p>List View (soon...)</p>
                </div>
            )}
        </div>
    )
}

export default PitchWrapper

