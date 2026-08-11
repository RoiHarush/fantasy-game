import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { useTeamFixtures } from "../../features/fixtures/useFixtures";
import { useGameweek } from "../../features/gameweeks/useGameweek";
import { usePlayerStats } from "../../features/players/usePlayerDetails";
import PlayerInfoContent from "./PlayerInfoContent";
import Switcher from "./Switcher";
import ImageWithFallback from "../../shared/ui/ImageWithFallback";
import CloseButton from "../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../shared/ui/ResponsiveDialog";

const POSITION_NAMES = {
    GK: "Goalkeeper",
    DEF: "Defender",
    MID: "Midfielder",
    FWD: "Forward",
};

function PlayerInfoModal({ player, onClose }) {
    const [tab, setTab] = useState("fixtures");
    const fixturesQuery = useTeamFixtures(player?.teamId);
    const statsQuery = usePlayerStats(player?.id);
    const { currentGameweek, nextGameweek } = useGameweek();

    if (!player) return null;

    const injuryColor = getInjuryColor(player.chanceOfPlayingNextRound);
    const activeQuery = tab === "fixtures" ? fixturesQuery : statsQuery;
    const fixtureBoundary = currentGameweek?.id ?? Math.max(0, (nextGameweek?.id ?? 1) - 1);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="flex max-h-[92dvh] flex-col sm:max-h-[min(88dvh,47.5rem)] sm:w-[min(calc(100vw-2rem),50rem)]">
                    <Dialog.Description className="sr-only">Player fixtures, statistics, and availability information.</Dialog.Description>
                    <Dialog.Close asChild>
                        <CloseButton className="absolute right-3 top-4 z-30" aria-label="Close player information" />
                    </Dialog.Close>

                    {(player.injured || injuryColor) && (
                        <div className="px-12 py-2 text-center text-sm font-bold text-white" style={{ backgroundColor: injuryColor || "#d81919" }}>
                            {player.news || "Unavailable"}
                        </div>
                    )}

                    <div className="relative flex min-h-[9.25rem] shrink-0 items-end bg-component-gradient px-4 pt-4 text-brand-ink sm:min-h-40 sm:px-6 sm:pt-5">
                        <div className="mr-3 shrink-0 leading-none sm:mr-5">
                            <ImageWithFallback
                                src={player.photo ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.photo}.png` : null}
                                fallbackSrc="/UI/player-placeholder.svg"
                                alt={player.viewName}
                                width={110}
                                height={140}
                                className="block h-auto w-[5.75rem] object-contain drop-shadow-lg sm:w-[7.5rem]"
                            />
                        </div>
                        <div className="min-w-0 flex-1 pb-4 pr-10 sm:pb-5">
                            <div className="mb-2 inline-block rounded-lg border border-white/45 bg-white/45 px-2.5 py-1 text-xs font-bold">{POSITION_NAMES[player.position] ?? player.position}</div>
                            <Dialog.Title asChild>
                                <h2 className="break-words text-2xl font-black leading-[1.08] sm:text-3xl">{player.firstName} {player.lastName}</h2>
                            </Dialog.Title>
                            <div className="mt-1 text-sm font-semibold opacity-70 sm:text-base">{player.teamName}</div>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app-surface">
                        <div className="flex shrink-0 justify-center border-b border-app-border bg-app-surface-elevated p-3.5">
                            <Switcher active={tab} options={["fixtures", "stats"]} onChange={setTab} />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-app-surface text-app-foreground [&>p]:p-6 [&>p]:text-center [&>p]:text-app-muted">
                            {activeQuery.isPending ? (
                                <p role="status">Loading player information...</p>
                            ) : activeQuery.error ? (
                                <p role="alert">{activeQuery.error.message || "Player information is temporarily unavailable."}</p>
                            ) : (
                                <PlayerInfoContent
                                    tab={tab}
                                    teamFixtures={fixturesQuery.data ?? {}}
                                    matchStats={statsQuery.data ?? []}
                                    fixtureBoundary={fixtureBoundary}
                                />
                            )}
                        </div>
                    </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

function getInjuryColor(chanceOfPlaying) {
    if (chanceOfPlaying === null || chanceOfPlaying >= 100) return null;
    if (chanceOfPlaying === 0) return "#d81919";
    if (chanceOfPlaying <= 25) return "#ff3b1f";
    if (chanceOfPlaying <= 50) return "#ff6b4a";
    if (chanceOfPlaying <= 75) return "#ff8c80";
    return null;
}

export default PlayerInfoModal;
