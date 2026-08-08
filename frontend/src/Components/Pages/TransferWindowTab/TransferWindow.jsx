import { useMemo, useState } from "react";
import {
    useDraftPlayer,
    useLatestTransferEvent,
    usePassTransferTurn,
    useTransferHistory,
} from "../../../features/transfer-window/useTransferWindow";
import {
    getDraftRuleLockedIds,
    getTransferNoticeMessage,
    getTurnsUntilUser,
    isSameTransferId,
} from "../../../features/transfer-window/model";
import Style from "../../../Styles/TransferWindow.module.css";
import ReplacementModal from "./ReplacementModal";
import IRSignModal from "./IRSignModal";
import DraftPickDialog from "./DraftPickDialog";
import PlayersWrapper from "../../General/PlayersWrapper";
import { useSquad } from "../../../features/squad/useSquad";

function TransferWindow({
    user,
    allUsers,
    windowState,
    nextGameweek,
    players,
    teams,
    fixturesByTeam,
}) {
    const [selectedPlayerIn, setSelectedPlayerIn] = useState(null);
    const latestEventQuery = useLatestTransferEvent(user?.leagueId);
    const currentTurnUserId = windowState.currentUserId ?? null;
    const turnOrder = windowState.order ?? [];
    const initialOrder = windowState.initialOrder ?? [];
    const turnsUsed = windowState.turnsUsed ?? {};
    const totalTurnsMap = windowState.totalTurns ?? {};
    const isWindowOpen = Boolean(windowState.isOpen);
    const isDraftMode = Boolean(windowState.isDraftMode);
    const isSupplementalDraft = windowState.draftType === "SUPPLEMENTAL";
    const isIrRound = windowState.currentRound === "IR";
    const irPosition = windowState.irPosition ?? null;
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
        () => (draftHistoryQuery.data ?? []).filter(action => (
            action.windowType === "DRAFT" || action.windowType === "SUPPLEMENTAL"
        )),
        [draftHistoryQuery.data],
    );

    const draftRuleLockedIds = useMemo(
        () => getDraftRuleLockedIds(players, draftSquad, isDraftMode && !isSupplementalDraft),
        [draftSquad, isDraftMode, isSupplementalDraft, players],
    );
    const displayedPlayers = isSupplementalDraft
        ? players.filter(player => player.supplementalDraftEligible)
        : players;

    const isDataReady = allUsers.length > 0 && (initialOrder.length > 0 || turnOrder.length > 0);

    const turnsLeft = getTurnsUntilUser(turnOrder, currentTurnUserId, user.id);

    if (!players || players.length === 0) return <div>Loading players...</div>;

    function getUserNameById(id) {
        const found = allUsers.find((item) => isSameTransferId(item.id, id));
        return found?.name || found?.fantasyTeamName || "Unknown manager";
    }

    if (!isWindowOpen) {
        return null;
    }

    const displayedOrder = isIrRound ? turnOrder : initialOrder;

    return (
        <div className={Style.transferPage}>
            <h2 className={Style.title}>
                {isSupplementalDraft ? "Supplemental Draft" : isDraftMode ? "Initial Draft" : "Transfer Window"}
            </h2>

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
                        const isCurrent = isSameTransferId(id, currentTurnUserId);

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
                    {isSameTransferId(currentTurnUserId, user.id) ? (
                        <>
                            <span className={Style.myTurn}>
                                {isIrRound
                                    ? `Pick replacement for ${irPosition} (IR)`
                                    : isSupplementalDraft
                                        ? "Your turn to replace a player with a new arrival"
                                        : isDraftMode ? "Your turn to draft a player" : "Your turn to make a transfer"}
                            </span>

                            {!isIrRound && (!isDraftMode || isSupplementalDraft) && (
                                <button
                                    type="button"
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

                {!isIrRound && !isSameTransferId(currentTurnUserId, user.id) && turnsLeft !== null && (
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

            <PlayersWrapper
                user={user}
                players={displayedPlayers}
                teams={teams}
                mode={isDraftMode && !isSupplementalDraft ? "draft" : "transfer"}
                onPlayerSelect={setSelectedPlayerIn}
                currentTurnUserId={currentTurnUserId}
                irPosition={isIrRound ? irPosition : null}
                allTeamFixtures={fixturesByTeam}
                disabledPlayerIds={draftRuleLockedIds}
                draftedContent={isDraftMode ? (
                    <ol className={Style.draftedList} aria-label="Drafted players in pick order">
                        {draftActions.map((action, index) => (
                            <li key={action.id}>
                                <span>Pick {index + 1}</span>
                                <strong>{action.userName || "Unknown manager"}</strong>
                                <span>{players.find((player) => isSameTransferId(player.id, action.playerInId))?.viewName || "Unknown player"}</span>
                            </li>
                        ))}
                        {draftActions.length === 0 && <li>No players have been drafted yet.</li>}
                    </ol>
                ) : null}
            />

            {selectedPlayerIn && (
                isIrRound ? (
                    <IRSignModal
                        player={selectedPlayerIn}
                        user={user}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                ) : isDraftMode && !isSupplementalDraft ? (
                    <DraftPickDialog
                        player={selectedPlayerIn}
                        mutation={draftPlayerMutation}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                ) : (
                    <ReplacementModal
                        playerIn={selectedPlayerIn}
                        user={user}
                        players={players}
                        fixturesByTeam={fixturesByTeam}
                        nextGameweek={nextGameweek}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                )
            )}
        </div>
    );
}

export default TransferWindow;
