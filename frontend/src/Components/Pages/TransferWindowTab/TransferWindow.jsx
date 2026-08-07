import { useMemo, useState } from "react";
import { usePlayers } from "../../../features/players/usePlayers";
import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import {
    useDraftPlayer,
    useLatestTransferEvent,
    usePassTransferTurn,
    useTransferHistory,
    useTransferWindowState,
} from "../../../features/transfer-window/useTransferWindow";
import { getTransferNoticeMessage } from "../../../features/transfer-window/model";
import Style from "../../../Styles/TransferWindow.module.css";
import ReplacementModal from "./ReplacementModal";
import ClosedWindow from "./ClosedWindow";
import IRSignModal from "./IRSignModal";
import PlayersWrapper from "../../General/PlayersWrapper";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useSquad } from "../../../features/squad/useSquad";

function TransferWindow({ user, allUsers }) {
    const { players } = usePlayers();
    const [selectedPlayerIn, setSelectedPlayerIn] = useState(null);
    const { nextGameweek } = useGameweek();
    const [draftView, setDraftView] = useState("players");
    const windowQuery = useTransferWindowState(user?.leagueId);
    const latestEventQuery = useLatestTransferEvent(user?.leagueId);
    const windowState = windowQuery.data ?? {};
    const currentTurnUserId = windowState.currentUserId ?? null;
    const turnOrder = windowState.order ?? [];
    const initialOrder = windowState.initialOrder ?? [];
    const turnsUsed = windowState.turnsUsed ?? {};
    const totalTurnsMap = windowState.totalTurns ?? {};
    const isWindowOpen = Boolean(windowState.isOpen);
    const isDraftMode = Boolean(windowState.isDraftMode);
    const isIrRound = windowState.currentRound === "IR";
    const irPosition = windowState.irPosition ?? null;
    const allTeamFixtures = useAllTeamFixtures();
    const lastTransferMessage = getTransferNoticeMessage(
        latestEventQuery.data,
        players,
        isDraftMode,
    );
    const draftGameweekId = windowState.gameWeekId > 0
        ? windowState.gameWeekId
        : nextGameweek?.id;
    const draftSquadQuery = useSquad(user?.id, draftGameweekId, { enabled: isDraftMode });
    const passMutation = usePassTransferTurn(user?.id);
    const draftPlayerMutation = useDraftPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        gameweekId: draftGameweekId,
        onSuccess: () => setSelectedPlayerIn(null),
    });
    const draftHistoryQuery = useTransferHistory(user?.leagueId, draftGameweekId, {
        enabled: isDraftMode,
    });
    const draftSquad = draftSquadQuery.data;
    const draftActions = useMemo(
        () => (draftHistoryQuery.data ?? []).filter(action => action.windowType === "DRAFT"),
        [draftHistoryQuery.data],
    );

    const draftRuleLockedIds = useMemo(() => {
        if (!isDraftMode) return new Set();
        const rosterIds = [
            ...Object.values(draftSquad?.startingLineup || {}).flat(),
            ...Object.values(draftSquad?.bench || {}),
        ].filter(Boolean);
        const rosterPlayers = rosterIds
            .map(id => players.find(player => player.id === id))
            .filter(Boolean);
        const positionLimits = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
        const positionCounts = {};
        const clubCounts = {};
        rosterPlayers.forEach(player => {
            positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
            clubCounts[player.teamId] = (clubCounts[player.teamId] || 0) + 1;
        });

        return new Set(players
            .filter(player => player.available)
            .filter(player => (
                (positionCounts[player.position] || 0) >= (positionLimits[player.position] || 0)
                || (clubCounts[player.teamId] || 0) >= 3
            ))
            .map(player => player.id));
    }, [draftSquad, isDraftMode, players]);

    const isDataReady = allUsers.length > 0 && (initialOrder.length > 0 || turnOrder.length > 0);

    function turnsUntilMyTurn() {
        if (!turnOrder.length || !currentTurnUserId) return null;
        const currentIndex = turnOrder.indexOf(currentTurnUserId);
        const myIndex = turnOrder.indexOf(user.id);

        if (currentIndex === -1 || myIndex === -1) return null;

        const diff = myIndex - currentIndex;
        return diff >= 0 ? diff : turnOrder.length + diff;
    }

    const turnsLeft = turnsUntilMyTurn();

    if (!players || players.length === 0) return <div>Loading players...</div>;

    function getUserNameById(id) {
        const found = allUsers.find(u => u.id === id);
        return found ? found.name : `User #${id}`;
    }

    if (!isWindowOpen) {
        return <div><ClosedWindow /></div>;
    }

    const displayedOrder = isIrRound ? turnOrder : initialOrder;

    return (
        <div className={Style.transferPage}>
            <h2 className={Style.title}>{isDraftMode ? "Initial Draft" : "Transfer Window"}</h2>

            <div className={Style.roundHeader}>
                <div className={Style.roundInfo}>
                    <span className={`${Style.roundBadge} ${isIrRound ? Style.irBadge : Style.regularBadge}`}>
                        {isIrRound ? "IR Round" : isDraftMode ? "Initial Draft" : "Regular Round"}
                    </span>
                    <span className={Style.roundSubtitle}>
                        {isDataReady ?
                            (isIrRound
                                ? `${displayedOrder.length} Eligible Managers`
                                : `${Object.keys(turnsUsed).length} Active Managers`)
                            : "Loading..."}
                    </span>
                </div>

                <div className={Style.turnsList}>
                    {displayedOrder.map((id) => {
                        const userName = getUserNameById(id);
                        const used = turnsUsed[id] || 0;
                        const userMax = totalTurnsMap[id] || 2;

                        const showProgress = !isIrRound;
                        const done = !isIrRound && used >= userMax;
                        const isCurrent = id === currentTurnUserId;

                        return (
                            <div
                                key={id}
                                className={`${Style.turnCard} ${done ? Style.done : ""} ${isCurrent ? Style.current : ""}`}
                            >
                                <div className={Style.userName}>{userName}</div>

                                {showProgress && (
                                    <>
                                        <div className={Style.turnProgress}>
                                            <div
                                                className={Style.turnBarFill}
                                                style={{ width: `${(used / userMax) * 100}%` }}
                                            />
                                        </div>
                                        <div className={Style.turnCount}>
                                            {used}/{userMax} {done && "✅"}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={Style.turnBar}>
                <div className={Style.turnContent}>
                    {currentTurnUserId === user.id ? (
                        <>
                            <span className={Style.myTurn}>
                                {isIrRound
                                    ? `Pick replacement for ${irPosition} (IR)`
                                    : isDraftMode ? "Your turn to draft a player" : "Your turn to make a transfer"}
                            </span>

                            {!isIrRound && !isDraftMode && (
                                <button
                                    className={Style.passButton}
                                    onClick={() => passMutation.mutate()}
                                    disabled={passMutation.isPending}
                                >
                                    {passMutation.isPending ? "Passing…" : "Pass Turn"}
                                </button>
                            )}
                        </>
                    ) : (
                        <span className={Style.otherTurn}>
                            Waiting for <strong>{getUserNameById(currentTurnUserId)}</strong>...
                        </span>
                    )}
                </div>

                {!isIrRound && currentTurnUserId !== user.id && turnsLeft !== null && (
                    <div className={Style.turnHint}>
                        {turnsLeft === 1 ? "You're next!" : `Your turn in ${turnsLeft} turns`}
                    </div>
                )}
            </div>

            {lastTransferMessage && (
                <div className={Style.transferMessage}>{lastTransferMessage}</div>
            )}
            {(passMutation.error || draftPlayerMutation.error) && (
                <div className={Style.transferMessage} role="alert">
                    {(passMutation.error || draftPlayerMutation.error).message}
                </div>
            )}

            {isDraftMode && (
                <div className={Style.draftTabs} role="tablist" aria-label="Draft views">
                    <button
                        type="button"
                        className={draftView === "players" ? Style.activeDraftTab : ""}
                        onClick={() => setDraftView("players")}
                    >Players</button>
                    <button
                        type="button"
                        className={draftView === "drafted" ? Style.activeDraftTab : ""}
                        onClick={() => setDraftView("drafted")}
                    >Drafted ({draftActions.length})</button>
                </div>
            )}

            {isDraftMode && draftView === "drafted" ? (
                <ol className={Style.draftedList}>
                    {draftActions.map((action, index) => (
                        <li key={action.id}>
                            <span>#{index + 1}</span>
                            <strong>{action.userName}</strong>
                            <span>{players.find(player => player.id === action.playerInId)?.viewName || `Player #${action.playerInId}`}</span>
                        </li>
                    ))}
                    {draftActions.length === 0 && <li>No players have been drafted yet.</li>}
                </ol>
            ) : (
                <PlayersWrapper
                    user={user}
                    mode={isDraftMode ? "draft" : "transfer"}
                    onPlayerSelect={setSelectedPlayerIn}
                    currentTurnUserId={currentTurnUserId}
                    irPosition={isIrRound ? irPosition : null}
                    allTeamFixtures={allTeamFixtures}
                    disabledPlayerIds={draftRuleLockedIds}
                />
            )}

            {selectedPlayerIn && (
                isIrRound ? (
                    <IRSignModal
                        player={selectedPlayerIn}
                        user={user}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                ) : isDraftMode ? (
                    <div role="dialog" aria-modal="true" className={Style.transferMessage}>
                        <p>Draft <strong>{selectedPlayerIn.viewName}</strong>?</p>
                        <button onClick={() => draftPlayerMutation.mutate(selectedPlayerIn.id)} disabled={draftPlayerMutation.isPending}>
                            {draftPlayerMutation.isPending ? "Saving…" : "Confirm pick"}
                        </button>
                        <button onClick={() => setSelectedPlayerIn(null)}>Cancel</button>
                    </div>
                ) : (
                    <ReplacementModal
                        playerIn={selectedPlayerIn}
                        user={user}
                        players={players}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                )
            )}
        </div>
    );
}

export default TransferWindow;
