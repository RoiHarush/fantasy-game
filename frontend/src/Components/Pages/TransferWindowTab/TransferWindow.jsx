import { useMemo, useState } from "react";

import { useSquad } from "../../../features/squad/useSquad";
import {
    useDraftPlayer,
    useLatestTransferEvent,
    usePassTransferTurn,
    useSkipCurrentTransferTurn,
    useTransferHistory,
} from "../../../features/transfer-window/useTransferWindow";
import {
    buildFallbackSnakeOrder,
    getCurrentPickNumber,
    getDraftRuleLockedIds,
    getTransferNoticeDetails,
    getTurnsUntilUser,
    isSameTransferId,
    summarizeSnakeOrder,
    transferActionToNotice,
} from "../../../features/transfer-window/model";
import PlayersWrapper from "../../General/PlayersWrapper";
import ActiveWindowHeader from "./ActiveWindowHeader";
import DraftPickDialog from "./DraftPickDialog";
import IRSignModal from "./IRSignModal";
import ReplacementModal from "./ReplacementModal";
import TransferActivityTable from "./TransferActivityTable";

function TransferWindow({
    user,
    allUsers,
    windowState,
    nextGameweek,
    players,
    teams,
    fixturesByTeam,
    isClosing = false,
    previewMode = false,
    previewSquad = null,
    previewDraftActions = [],
    previewTransferActions = [],
    previewLatestEvent = null,
    previewOnPass = null,
    readOnly = false,
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
    const latestEvent = previewMode ? previewLatestEvent : latestEventQuery.data;
    const draftGameweekId = windowState.gameWeekId > 0
        ? windowState.gameWeekId
        : nextGameweek?.id;
    const draftSquadQuery = useSquad(user?.id, draftGameweekId, { enabled: isDraftMode && !previewMode });
    const passMutation = usePassTransferTurn(user?.id);
    const skipTurnMutation = useSkipCurrentTransferTurn(user?.leagueId);
    const draftPlayerMutation = useDraftPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        gameweekId: draftGameweekId,
        onSuccess: () => setSelectedPlayerIn(null),
    });
    const historyQuery = useTransferHistory(user?.leagueId, draftGameweekId, {
        enabled: !previewMode,
    });
    const draftSquad = previewMode ? previewSquad : draftSquadQuery.data;
    const activityActions = useMemo(() => {
        const actions = previewMode
            ? isDraftMode ? previewDraftActions : previewTransferActions
            : historyQuery.data ?? [];
        return actions.filter((action) => isDraftMode
            ? action.windowType === "DRAFT" || action.windowType === "SUPPLEMENTAL"
            : action.windowType === "TRANSFER");
    }, [historyQuery.data, isDraftMode, previewDraftActions, previewMode, previewTransferActions]);
    const latestPersistedAction = activityActions.at(-1) ?? null;
    const notice = latestEvent ?? transferActionToNotice(latestPersistedAction);
    const lastTransferNotice = getTransferNoticeDetails(notice, players, isDraftMode);

    const draftRuleLockedIds = useMemo(
        () => getDraftRuleLockedIds(players, draftSquad, isDraftMode && !isSupplementalDraft),
        [draftSquad, isDraftMode, isSupplementalDraft, players],
    );
    const displayedPlayers = isSupplementalDraft
        ? players.filter((player) => (
            player.supplementalDraftSelectable ?? player.supplementalDraftEligible
        ))
        : players;
    const canonicalOrder = windowState.canonicalOrder?.length > 0
        ? windowState.canonicalOrder
        : buildFallbackSnakeOrder(initialOrder, totalTurnsMap);
    const summaryOrder = isIrRound ? turnOrder : canonicalOrder;
    const managerSummaries = summarizeSnakeOrder(summaryOrder, allUsers, turnsUsed, totalTurnsMap, {
        automaticUserIds: windowState.automaticUserIds ?? [],
        onlineUserIds: windowState.onlineUserIds ?? [],
    });
    const currentPickNumber = isIrRound ? null : getCurrentPickNumber(turnsUsed, canonicalOrder);
    const turnsLeft = getTurnsUntilUser(turnOrder, currentTurnUserId, user.id);
    const currentUserName = getUserName(allUsers, currentTurnUserId);
    const title = isSupplementalDraft ? "Supplemental draft" : isDraftMode ? "Initial draft" : "Transfer window live";
    const mutationError = passMutation.error || skipTurnMutation.error || draftPlayerMutation.error;

    if (!players || players.length === 0) return <div>Loading players...</div>;
    if (!isWindowOpen) return null;

    const activityView = {
        key: isDraftMode ? "Drafted" : "Transferred",
        mobileLabel: isDraftMode ? "Draft" : "Moves",
        desktopLabel: isDraftMode ? "Drafted" : "Transferred",
        content: (
            <TransferActivityTable
                actions={activityActions}
                players={players}
                pending={!previewMode && historyQuery.isPending}
                error={!previewMode ? historyQuery.error : null}
                mode={isSupplementalDraft ? "supplemental" : isDraftMode ? "draft" : "transfer"}
            />
        ),
    };

    return (
        <div className="w-full min-w-0 text-app-foreground">
            <ActiveWindowHeader
                title={title}
                isDraftMode={isDraftMode}
                isSupplementalDraft={isSupplementalDraft}
                isIrRound={isIrRound}
                isClosing={isClosing}
                currentUserId={currentTurnUserId}
                currentUserName={currentUserName}
                currentUserAutomatic={windowState.currentUserAutomatic}
                viewingUser={user}
                currentPickNumber={currentPickNumber}
                totalPicks={canonicalOrder.length}
                turnsLeft={turnsLeft}
                managerSummaries={managerSummaries}
                lastTransferNotice={lastTransferNotice}
                errorMessage={mutationError?.message}
                passPending={passMutation.isPending}
                skipPending={skipTurnMutation.isPending}
                onPass={() => previewMode ? previewOnPass?.() : passMutation.mutate()}
                onSkip={() => previewMode ? undefined : skipTurnMutation.mutate()}
                readOnly={readOnly}
            />

            <PlayersWrapper
                user={user}
                players={displayedPlayers}
                teams={teams}
                mode={isDraftMode && !isSupplementalDraft ? "draft" : "transfer"}
                onPlayerSelect={isClosing || readOnly ? undefined : setSelectedPlayerIn}
                currentTurnUserId={isClosing ? null : currentTurnUserId}
                irPosition={isIrRound ? irPosition : null}
                allTeamFixtures={fixturesByTeam}
                disabledPlayerIds={draftRuleLockedIds}
                previewMode={previewMode}
                activityView={activityView}
            />

            {!isClosing && !readOnly && selectedPlayerIn && (
                isIrRound ? (
                    <IRSignModal player={selectedPlayerIn} user={user} onClose={() => setSelectedPlayerIn(null)} />
                ) : isDraftMode && !isSupplementalDraft ? (
                    <DraftPickDialog
                        player={selectedPlayerIn}
                        mutation={previewMode ? { mutate: () => setSelectedPlayerIn(null), isPending: false, error: null } : draftPlayerMutation}
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
                        previewMode={previewMode}
                        previewSquad={previewSquad}
                    />
                )
            )}
        </div>
    );
}

function getUserName(users, id) {
    const found = users.find((item) => isSameTransferId(item.id, id));
    return found?.name || found?.fantasyTeamName || "Unknown manager";
}

export default TransferWindow;
