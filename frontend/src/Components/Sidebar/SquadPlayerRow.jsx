import { Info } from "lucide-react";
import { useState } from "react";

import { getPlayerInjuryColor } from "../../lib/playerStatus";
import PlayerInfoModal from "../General/PlayerInfoModal";
import PlayerKit from "../General/PlayerKit";

function SquadPlayerRow({ player, fixture }) {
    const [showInfo, setShowInfo] = useState(false);
    const injuryColor = getPlayerInjuryColor(player?.chanceOfPlayingNextRound);

    return (
        <>
            <tr className="h-12 border-t border-app-border/70 bg-app-surface transition-colors hover:bg-app-accent-hover">
                <td className="px-1 text-center" style={{ width: "2.25rem" }}>
                    {player && (
                        <button
                            type="button"
                            className="mx-auto grid size-4 place-items-center p-0 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-app-accent"
                            style={{ color: injuryColor || "var(--app-muted)" }}
                            onClick={() => setShowInfo(true)}
                            aria-label={`View ${player.viewName} information`}
                        >
                            <Info aria-hidden="true" size={14} strokeWidth={2.2} />
                        </button>
                    )}
                </td>
                <td className="min-w-0 overflow-hidden py-1 pr-1">
                    <div className="flex min-w-0 items-center gap-2">
                        <PlayerKit
                            teamId={player?.teamId || 0}
                            type={player?.position === "GK" ? "gk" : "field"}
                            className="block h-7 max-h-7 w-7 max-w-7 shrink-0 object-contain sm:h-8 sm:max-h-8 sm:w-8 sm:max-w-8"
                            style={{ width: "1.75rem", height: "1.75rem" }}
                        />
                        <div className="min-w-0 leading-tight">
                            <span className="block truncate text-xs font-bold text-app-foreground">{player?.viewName || "Empty slot"}</span>
                            <span className="block truncate text-[0.65rem] text-app-muted">
                                {player ? `${player.teamShort || ""} ${player.position}` : "Waiting for draft pick"}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="truncate px-1 text-right text-[0.54rem] font-bold text-app-muted sm:px-1.5 sm:text-[0.66rem]" style={{ width: "3.75rem" }} title={fixture}>{fixture}</td>
            </tr>

            {showInfo && player && (
                <PlayerInfoModal player={player} onClose={() => setShowInfo(false)} />
            )}
        </>
    );
}

export default SquadPlayerRow;
