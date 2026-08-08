import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";

import { useTeamsContext } from "../../Context/TeamsContext";
import { useTeamFixtures } from "../../features/fixtures/useFixtures";
import { useGameweek } from "../../features/gameweeks/useGameweek";
import { usePlayerStats } from "../../features/players/usePlayerDetails";
import Style from "../../Styles/CompareModal.module.css";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";
import PlayerInfoContent from "./PlayerInfoContent";
import Switcher from "./Switcher";

function CompareModal({ players, onClose }) {
    const [tab, setTab] = useState("fixtures");
    const [left, right] = players;
    const leftFixturesQuery = useTeamFixtures(left?.teamId);
    const rightFixturesQuery = useTeamFixtures(right?.teamId);
    const leftStatsQuery = usePlayerStats(left?.id);
    const rightStatsQuery = usePlayerStats(right?.id);
    const { teamsById } = useTeamsContext();
    const { currentGameweek, nextGameweek } = useGameweek();

    if (!left || !right) return null;

    const activeQueries = tab === "fixtures"
        ? [leftFixturesQuery, rightFixturesQuery]
        : [leftStatsQuery, rightStatsQuery];
    const isPending = activeQueries.some((query) => query.isPending);
    const error = activeQueries.find((query) => query.error)?.error;
    const fixtureBoundary = currentGameweek?.id ?? Math.max(0, (nextGameweek?.id ?? 1) - 1);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className={Style.overlay} />
                <Dialog.Content className={Style.compareModal}>
                    <Dialog.Title className="sr-only">Compare {left.viewName} and {right.viewName}</Dialog.Title>
                    <Dialog.Description className="sr-only">Side-by-side fixtures and statistics for two players.</Dialog.Description>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.closeBtn} aria-label="Close comparison">✕</button>
                    </Dialog.Close>

                    <div className={Style.compareHeader}>
                        <PlayerComparisonHeader player={left} side="left" team={teamsById.get(String(left.teamId))} />
                        <div className={Style.vsText}>VS</div>
                        <PlayerComparisonHeader player={right} side="right" team={teamsById.get(String(right.teamId))} />
                    </div>

                    <Switcher active={tab} options={["fixtures", "stats"]} onChange={setTab} />

                    {isPending ? (
                        <p role="status">Loading comparison…</p>
                    ) : error ? (
                        <p role="alert">{error.message || "The comparison is temporarily unavailable."}</p>
                    ) : (
                        <div className={Style.compareContent}>
                            <div className={Style.side}>
                                <PlayerInfoContent
                                    tab={tab}
                                    teamFixtures={leftFixturesQuery.data ?? {}}
                                    matchStats={leftStatsQuery.data ?? []}
                                    fixtureBoundary={fixtureBoundary}
                                />
                            </div>
                            <div className={Style.side}>
                                <PlayerInfoContent
                                    tab={tab}
                                    teamFixtures={rightFixturesQuery.data ?? {}}
                                    matchStats={rightStatsQuery.data ?? []}
                                    fixtureBoundary={fixtureBoundary}
                                />
                            </div>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function PlayerComparisonHeader({ player, side, team }) {
    return (
        <div className={`${Style.playerSection} ${Style[side]}`}>
            {player.photo && (
                <Image
                    src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.photo}.png`}
                    alt={player.viewName}
                    width={110}
                    height={140}
                    className={Style.playerImage}
                />
            )}
            <div className={Style.details}>
                <div className={Style.position}>{player.position}</div>
                <h2 className={Style.name}>{player.viewName}</h2>
                <div className={Style.team}>
                    <TeamLogo team={team} /> {player.teamName}
                </div>
                <div className={Style.totalPoints}>
                    Total Points: <strong>{player.points}</strong>
                </div>
            </div>
        </div>
    );
}

export default CompareModal;
