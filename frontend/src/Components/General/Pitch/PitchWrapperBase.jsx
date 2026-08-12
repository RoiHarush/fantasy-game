import Image from "next/image";
import { useState } from "react";

import PlayerKit from "../PlayerKit";
import Switcher from "../Switcher";
import IrContainment from "./IrContainment";
import Pitch from "./Pitch";
import AutoSubstitutionList from "./AutoSubstitutionList";

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
        <div className="relative block w-full min-w-0">
            <div className="relative flex h-full w-full min-w-0 max-w-[1000px] flex-col items-center gap-4 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_2px_8px_rgba(27,16,53,0.1)] max-md:gap-2.5 max-md:rounded-[10px]">
                <div className="relative w-full overflow-hidden rounded-t-[10px] py-5 [background:var(--component-gradient)]">
                    <Image
                        src="/UI/pattern-2.png"
                        alt=""
                        width={900}
                        height={220}
                        className="pointer-events-none absolute top-0 right-0 z-0 h-auto w-[250px] object-contain"
                    />
                    <div>{view === "points" && gwControl}</div>
                    <div className="relative z-[2] mx-auto flex w-[90%] items-center justify-center">{block}</div>
                    <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full [background:linear-gradient(to_bottom,transparent_0%,var(--app-surface)_100%)]" />
                </div>

                <div className="flex w-full justify-center px-3">
                    <Switcher
                        active={activeButton}
                        options={["Pitch View", "List View"]}
                        onChange={setActiveButton}
                    />
                </div>

                {squad && (
                    <section className="flex min-h-13 w-[calc(100%-24px)] items-center gap-2.5 self-center rounded-xl border border-[var(--app-accent-border)] bg-[var(--app-accent-surface)] px-2.5 py-2 max-md:min-h-[46px] max-md:w-[calc(100%-16px)] max-md:gap-2 max-md:px-2 max-md:py-1.5" aria-label="Injured reserve slot">
                        <div className="shrink-0 rounded-full border border-[var(--app-accent-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-[0.68rem] font-extrabold tracking-[0.08em] text-[var(--app-accent-foreground)] uppercase max-md:px-2 max-md:py-1 max-md:text-[0.62rem]">
                            IR Slot
                        </div>
                        {irPlayer ? (
                            <div className="flex min-w-0 items-center gap-2 text-[var(--app-foreground)]">
                                <IrContainment>
                                    <PlayerKit
                                        teamId={irPlayer.teamId}
                                        type={irPlayer.position === "GK" ? "gk" : "field"}
                                        className="h-auto w-12 shrink-0 object-contain max-md:w-10"
                                    />
                                </IrContainment>
                                <span className="min-w-0 truncate text-[0.78rem] font-bold max-md:text-[0.72rem]">
                                    {irPlayer.viewName}
                                </span>
                                <span className="rounded-full bg-[var(--app-surface)] px-1.5 py-0.5 text-[0.62rem] font-bold text-[var(--app-muted)]">
                                    {irPlayer.position}
                                </span>
                            </div>
                        ) : (
                            <div className="flex min-w-0 items-center gap-2 text-[var(--app-foreground)]">
                                <Image
                                    src="/Kits/0.webp"
                                    alt=""
                                    width={40}
                                    height={50}
                                    className="h-9 w-[30px] shrink-0 object-contain opacity-60 max-md:h-[30px] max-md:w-[25px]"
                                />
                                <span className="min-w-0 truncate text-[0.78rem] font-bold max-md:text-[0.72rem]">Empty slot</span>
                            </div>
                        )}
                    </section>
                )}

                {activeButton === "Pitch View" ? (
                    <div className="flex w-full min-w-0 justify-center overflow-hidden">
                        <Pitch
                            squad={squad}
                            view={view}
                            currentGw={currentGw}
                            playerData={playerData}
                            players={players}
                        />
                    </div>
                ) : (
                    <div className="grid min-h-60 w-full place-items-center text-[var(--app-muted)]">
                        <p>List View (soon...)</p>
                    </div>
                )}

                {view === "points" && (
                    <AutoSubstitutionList
                        substitutions={squad?.autoSubstitutions}
                        players={players}
                    />
                )}
            </div>
        </div>
    );
}

export default PitchWrapperBase;
