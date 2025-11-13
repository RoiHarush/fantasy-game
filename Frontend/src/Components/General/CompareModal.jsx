import { useState, useEffect } from "react";
import Style from "../../Styles/CompareModal.module.css";
import PlayerInfoContent from "./PlayerInfoContent";
import Switcher from "./Switcher";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";
import { useFixtures } from "../../Context/FixturesContext";
import API_URL from "../../config";

function CompareModal({ players, onClose }) {
    const { getFixturesForTeam } = useFixtures();
    const [tab, setTab] = useState("fixtures");
    const [leftStats, setLeftStats] = useState([]);
    const [rightStats, setRightStats] = useState([]);
    const [leftFixtures, setLeftFixtures] = useState({});
    const [rightFixtures, setRightFixtures] = useState({});
    const [left, right] = players;

    useEffect(() => {
        if (left?.teamId) getFixturesForTeam(left.teamId).then(setLeftFixtures);
        if (right?.teamId) getFixturesForTeam(right.teamId).then(setRightFixtures);

        if (left)
            fetch(`${API_URL}/api/players/${left.id}/all-stats`)
                .then(res => res.ok ? res.json() : [])
                .then(setLeftStats);
        if (right)
            fetch(`${API_URL}/api/players/${right.id}/all-stats`)
                .then(res => res.ok ? res.json() : [])
                .then(setRightStats);
    }, [left, right]);

    if (!left || !right) return null;

    return (
        <div className={Style.overlay}>
            <div className={Style.compareModal}>
                <button className={Style.closeBtn} onClick={onClose}>✕</button>

                <div className={Style.compareHeader}>
                    <div className={`${Style.playerSection} ${Style.left}`}>
                        <img
                            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${left.photo}.png`}
                            alt={left.viewName}
                            className={Style.playerImage}
                        />
                        <div className={Style.details}>
                            <div className={Style.position}>{left.position}</div>
                            <h2 className={Style.name}>{left.viewName}</h2>
                            <div className={Style.team}>
                                <TeamLogo teamId={left.teamId} /> {left.teamName}
                            </div>
                            <div className={Style.totalPoints}>
                                Total Points: <strong>{left.points}</strong>
                            </div>
                        </div>
                    </div>

                    <div className={Style.vsText}>VS</div>

                    <div className={`${Style.playerSection} ${Style.right}`}>
                        <img
                            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${right.photo}.png`}
                            alt={right.viewName}
                            className={Style.playerImage}
                        />
                        <div className={Style.details}>
                            <div className={Style.position}>{right.position}</div>
                            <h2 className={Style.name}>{right.viewName}</h2>
                            <div className={Style.team}>
                                <TeamLogo teamId={right.teamId} /> {right.teamName}
                            </div>
                            <div className={Style.totalPoints}>
                                Total Points: <strong>{right.points}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <Switcher active={tab} options={["fixtures", "stats"]} onChange={setTab} />

                <div className={Style.compareContent}>
                    <div className={Style.side}>
                        <PlayerInfoContent player={left} tab={tab} teamFixtures={leftFixtures} matchStats={leftStats} />
                    </div>
                    <div className={Style.side}>
                        <PlayerInfoContent player={right} tab={tab} teamFixtures={rightFixtures} matchStats={rightStats} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CompareModal;
