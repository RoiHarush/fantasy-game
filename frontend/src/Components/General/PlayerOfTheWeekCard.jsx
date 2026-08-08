import PlayerKit from "../General/PlayerKit";
import { cn } from "../../lib/cn";

function PlayerOfWeekCard({ player, size = "normal" }) {
    if (!player) return null;

    const hasPoints = player.points !== null && player.points !== undefined;

    return (
        <div className="relative flex w-full cursor-pointer flex-col items-center text-center">
            <PlayerKit
                teamId={player.teamId ?? 0}
                type={player.position === "GK" ? "gk" : "field"}
                className={cn(
                    "relative mb-1 h-auto drop-shadow-[0_3px_3px_rgba(0,0,0,0.25)]",
                    size === "small" ? "w-[50px]" : "w-[65px]",
                )}
            />

            <div className={cn(
                "w-full overflow-hidden rounded-t-sm bg-brand-ink px-1 py-1 font-bold tracking-wide text-ellipsis whitespace-nowrap text-white",
                size === "small" ? "text-[10px]" : "text-[11px]",
            )}>{player.playerName || "-"}</div>

            <div
                className={cn(
                    "flex min-h-[18px] w-full items-center rounded-b-sm bg-linear-to-r from-brand-green to-brand-cyan px-1.5 py-1 text-[10px] font-semibold text-brand-ink",
                    hasPoints ? "justify-between" : "justify-center",
                    size === "small" && "px-1 py-0.5",
                )}
            >
                <div className="text-[10px] font-extrabold">GW{player.gameweek}</div>
                {hasPoints && (
                    <div className="text-[11px] font-bold">{player.points} pts</div>
                )}
            </div>
        </div>
    );
}

export default PlayerOfWeekCard;
