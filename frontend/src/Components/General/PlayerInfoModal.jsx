import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Style from "../../Styles/PlayerInfoModal.module.css";
import Switcher from "./Switcher";
import PlayerInfoContent from "./PlayerInfoContent";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import { apiRequest } from "../../services/apiClient";
import { queryKeys } from "../../lib/query/keys";

function PlayerInfoModal({ player, onClose }) {
    useLockBodyScroll();

    const [tab, setTab] = useState("fixtures");
    const fixturesQuery = useQuery({
        queryKey: queryKeys.teamFixtures(player?.teamId),
        queryFn: () => apiRequest(`/api/fixtures/team/${player.teamId}`),
        enabled: Boolean(player?.teamId),
        staleTime: 5 * 60_000,
    });
    const statsQuery = useQuery({
        queryKey: queryKeys.playerStats(player?.id),
        queryFn: () => apiRequest(`/api/players/${player.id}/all-stats`, { auth: false }),
        enabled: Boolean(player?.id),
        staleTime: 5 * 60_000,
    });

    if (!player) return null;

    const positionMap = {
        GK: "Goalkeeper",
        DEF: "Defender",
        MID: "Midfielder",
        FWD: "Forward"
    };

    let injuryColor = null;
    if (player.chanceOfPlayingNextRound !== null && player.chanceOfPlayingNextRound < 100) {
        const c = player.chanceOfPlayingNextRound;
        if (c === 0) injuryColor = "#d81919";
        else if (c <= 25) injuryColor = "#ff3b1f";
        else if (c <= 50) injuryColor = "#ff6b4a";
        else if (c <= 75) injuryColor = "#ff8c80";
    }

    return (
        <div className={Style.overlay}>
            <div className={Style.modal}>
                <button className={Style.closeBtn} onClick={onClose}>✕</button>

                {(player.injured || injuryColor) && (
                    <div className={Style.injuryBanner} style={{ backgroundColor: injuryColor || "#d81919" }}>
                        {player.news || "Unavailable"}
                    </div>
                )}

                <div className={Style.header}>
                    <div className={Style.left}>
                        <img
                            src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.photo}.png`}
                            alt={player.viewName}
                            className={Style.playerImage}
                        />
                    </div>
                    <div className={Style.right}>
                        <div className={Style.positionTag}>{positionMap[player.position]}</div>
                        <h2 className={Style.name}>{player.firstName} {player.lastName}</h2>

                        <div className={Style.teamName}>{player.teamName}</div>
                    </div>
                </div>

                <div className={Style.bodyContent}>
                    <div className={Style.switcherWrapper}>
                        <Switcher active={tab} options={["fixtures", "stats"]} onChange={setTab} />
                    </div>

                    <div className={Style.tabContent}>
                        <PlayerInfoContent
                            player={player}
                            tab={tab}
                            teamFixtures={fixturesQuery.data ?? {}}
                            matchStats={statsQuery.data ?? []}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlayerInfoModal;
