import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";

import { useTeamFixtures } from "../../features/fixtures/useFixtures";
import { useGameweek } from "../../features/gameweeks/useGameweek";
import { usePlayerStats } from "../../features/players/usePlayerDetails";
import Style from "../../Styles/PlayerInfoModal.module.css";
import PlayerInfoContent from "./PlayerInfoContent";
import Switcher from "./Switcher";
import ImageWithFallback from "../../shared/ui/ImageWithFallback";

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
            <Dialog.Portal>
                <Dialog.Overlay className={Style.overlay} />
                <Dialog.Content className={Style.modal}>
                    <Dialog.Description className="sr-only">Player fixtures, statistics, and availability information.</Dialog.Description>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.closeBtn} aria-label="Close player information">
                            <X aria-hidden="true" size={20} />
                        </button>
                    </Dialog.Close>

                    {(player.injured || injuryColor) && (
                        <div className={Style.injuryBanner} style={{ backgroundColor: injuryColor || "#d81919" }}>
                            {player.news || "Unavailable"}
                        </div>
                    )}

                    <div className={Style.header}>
                        <div className={Style.left}>
                            <ImageWithFallback
                                src={player.photo ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.photo}.png` : null}
                                fallbackSrc="/UI/player-placeholder.svg"
                                alt={player.viewName}
                                width={110}
                                height={140}
                                className={Style.playerImage}
                            />
                        </div>
                        <div className={Style.right}>
                            <div className={Style.positionTag}>{POSITION_NAMES[player.position] ?? player.position}</div>
                            <Dialog.Title asChild>
                                <h2 className={Style.name}>{player.firstName} {player.lastName}</h2>
                            </Dialog.Title>
                            <div className={Style.teamName}>{player.teamName}</div>
                        </div>
                    </div>

                    <div className={Style.bodyContent}>
                        <div className={Style.switcherWrapper}>
                            <Switcher active={tab} options={["fixtures", "stats"]} onChange={setTab} />
                        </div>

                        <div className={Style.tabContent}>
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
                </Dialog.Content>
            </Dialog.Portal>
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
