import PlayerKit from "./PlayerKit";
import { CalendarX2, Crown } from "lucide-react";
import { usePlayerInteraction } from "../../Context/PlayerInteractionProvider";
import { cn } from "../../lib/cn";
import FirstPickAura from "./Pitch/FirstPickAura";
import TripleCaptainEffect from "./Pitch/TripleCaptainEffect";


function PlayerCard({
    player,
    view,
    captain = false,
    viceCaptain = false,
    captainMultiplier = 2,
    chipEffect = null,
    pointsLeader = false,
    points = null,
    nextFixture = null,
    nextFixtures = [],
    fixturePostponed = false,
}) {
    const { handlePlayerClick, selectedPlayerId, disabledIds } = usePlayerInteraction();

    if (!player) {
        return (
            <div className="relative m-1.5 flex h-full w-20 cursor-default flex-col items-center justify-center bg-transparent p-0 text-center max-md:m-0 max-md:h-auto max-md:w-full max-md:min-w-0 max-md:max-w-[72px] max-md:justify-self-center">
                <PlayerKit
                    teamId={0}
                    type=""
                    className="relative z-[1] h-auto w-[50px] opacity-85 drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] max-md:w-[clamp(30px,9vw,42px)]"
                />
            </div>
        );
    }

    const isSelected = view === "pick" && String(selectedPlayerId) === String(player.id);
    const isDisabled = view === "pick" && disabledIds.some((id) => String(id) === String(player.id));

    const handleClick = () => {
        if (isDisabled) return;
        handlePlayerClick(player.id);
    };

    let injuryColor = null;
    if (player.chanceOfPlayingNextRound !== null && player.chanceOfPlayingNextRound < 100) {
        const c = player.chanceOfPlayingNextRound;
        if (c === 0) injuryColor = "#d81919";
        else if (c <= 25) injuryColor = "#ff3b1f";
        else if (c <= 50) injuryColor = "#ff6b4a";
        else if (c <= 75) injuryColor = "#ff8c80";
    }

    const hasPoints = points !== null && points !== undefined;
    const shownPoints = hasPoints ? (captain ? points * captainMultiplier : points) : null;
    const fixtureItems = nextFixtures.length > 0
        ? nextFixtures
        : nextFixture
            ? [nextFixture]
            : [];
    return (
        <button
            type="button"
            className={cn(
                "relative isolate m-1.5 flex h-full w-20 cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-center font-[inherit] text-inherit transition-[transform,opacity] duration-150 hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#00ff87] max-md:m-0 max-md:h-auto max-md:w-full max-md:min-w-0 max-md:max-w-[72px] max-md:justify-self-center",
                isDisabled && "pointer-events-none opacity-40",
            )}
            onClick={handleClick}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-label={`${player.viewName}${captain ? ", captain" : viceCaptain ? ", vice-captain" : ""}`}
        >
            <div className="absolute top-1 right-1 z-[4] flex flex-col items-center gap-1 max-md:top-0.5 max-md:right-0.5 max-md:gap-0.5">
                {(player.injured || injuryColor) && (
                    <span
                        className="flex size-4 items-center justify-center rounded-full text-xs font-black text-white shadow-[0_0_4px_rgba(0,0,0,0.3)] max-md:size-2.5 max-md:text-[8px]"
                        style={{ backgroundColor: injuryColor || "#d81919" }}
                    >
                        !
                    </span>
                )}
                {fixturePostponed && !hasPoints && (
                    <span
                        className="grid size-5 place-items-center rounded-full border border-cyan-200/80 bg-[#37003c] text-cyan-200 shadow-[0_0_8px_rgb(34_211_238/0.65)] max-md:size-3.5"
                        title="Fixture postponed"
                        aria-label="Fixture postponed"
                    >
                        <CalendarX2 aria-hidden="true" className="size-3 max-md:size-2.5" />
                    </span>
                )}
            </div>

            {(captain || viceCaptain) && (
                <div className="absolute top-1.5 -left-2.5 z-[3] max-md:-left-0.5">
                    {captain && (
                        <div className="flex size-[18px] items-center justify-center rounded-full bg-[#3c1053] text-[11px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] max-md:size-3 max-md:text-[9px]">
                            C
                        </div>
                    )}
                    {viceCaptain && !captain && (
                        <div className="flex size-[18px] items-center justify-center rounded-full bg-[#3c1053] text-[11px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] max-md:size-3 max-md:text-[9px]">
                            V
                        </div>
                    )}
                </div>
            )}

            <span className="player-kit-stage relative z-[1] mb-2 flex w-full justify-center max-md:mb-0.5">
                {chipEffect === "triple-captain" && <TripleCaptainEffect />}
                {chipEffect === "first-pick-captain" && <FirstPickAura />}
                {pointsLeader && (
                    <Crown
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-5 left-1/2 z-[4] size-7 fill-amber-300 text-amber-500 [animation:chip-crown-float_2.2s_ease-in-out_infinite] [filter:drop-shadow(0_2px_4px_rgb(0_0_0/0.35))_drop-shadow(0_0_5px_rgb(251_191_36/0.65))] motion-reduce:animate-none max-md:-top-3.5 max-md:size-5"
                    />
                )}
                <PlayerKit
                    teamId={player.teamId}
                    type={player.position === "GK" ? "gk" : "field"}
                    className={cn(
                        "relative z-[1] h-auto w-3/5 drop-shadow-[0_3px_3px_rgba(0,0,0,0.25)] max-md:w-[clamp(30px,9vw,42px)]",
                        isSelected && "drop-shadow-[0_0_10px_#00ff87]",
                    )}
                />
            </span>

            <div
                className="relative z-[1] mb-0 w-[130%] rounded-t-[3px] bg-[#37003c] px-0 py-0.5 text-center text-xs font-bold tracking-[0.3px] text-white max-md:flex max-md:w-full max-md:min-w-0 max-md:items-center max-md:justify-center max-md:truncate max-md:text-[clamp(7px,2.2vw,10px)]"
                style={injuryColor ? { backgroundColor: injuryColor } : {}}
            >
                {player.viewName}
            </div>

            <div className="relative z-[1] flex min-h-8 w-[130%] flex-col items-center justify-center rounded-b-[3px] bg-white/30 px-0.5 py-0.5 text-center text-[10px] leading-[1.05] font-semibold text-[#111] max-md:min-h-7 max-md:w-full max-md:min-w-0 max-md:text-[7px]">
                {hasPoints ? (
                    shownPoints
                ) : fixturePostponed ? (
                    <span className="sr-only">Fixture postponed</span>
                ) : fixtureItems.length > 0 ? (
                    fixtureItems.map((fixture, index) => (
                        <span key={`${fixture}-${index}`} className="block w-full truncate">
                            {fixture}{index < fixtureItems.length - 1 ? "," : ""}
                        </span>
                    ))
                ) : (
                    "-"
                )}
            </div>
        </button>
    );
}

export default PlayerCard;
