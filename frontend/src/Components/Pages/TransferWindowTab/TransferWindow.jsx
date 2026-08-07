import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { usePlayers } from "../../../Context/PlayersContext";
import { useWebSocket } from "../../../Context/WebSocketContext";
import { fetchTransferHistory, makeDraftPick, passTurn } from "../../../services/transferWindowService";
import { useAllTeamFixtures } from "../../../hooks/useAllTeamFixtures";
import Style from "../../../Styles/TransferWindow.module.css";
import ReplacementModal from "./ReplacementModal";
import ClosedWindow from "./ClosedWindow";
import IRSignModal from "./IRSignModal";
import PlayersWrapper from "../../General/PlayersWrapper";
import { fetchSquadForGameweek } from "../../../services/squadService";
import { useGameweek } from "../../../Context/GameweeksContext";

function TransferWindow({ user, allUsers, initialWindowState }) {
    const { players, setPlayers } = usePlayers();
    const [selectedPlayerIn, setSelectedPlayerIn] = useState(null);

    const [currentTurnUserId, setCurrentTurnUserId] = useState(initialWindowState?.currentUserId ?? null);
    const [lastTransferMessage, setLastTransferMessage] = useState(null);
    const [isWindowOpen, setIsWindowOpen] = useState(initialWindowState?.isOpen ?? false);

    const [turnOrder, setTurnOrder] = useState(initialWindowState?.order || []);
    const [initialOrder, setInitialOrder] = useState(initialWindowState?.initialOrder || []);

    const [turnsUsed, setTurnsUsed] = useState(initialWindowState?.turnsUsed || {});
    const [totalTurnsMap, setTotalTurnsMap] = useState(initialWindowState?.totalTurns || {});

    const { subscribe, connected } = useWebSocket();

    const [isIrRound, setIsIrRound] = useState(initialWindowState?.currentRound === 'IR');
    const [irPosition, setIrPosition] = useState(null);
    const isDraftMode = Boolean(initialWindowState?.isDraftMode);
    const { nextGameweek } = useGameweek();
    const [draftSquad, setDraftSquad] = useState(null);
    const [draftView, setDraftView] = useState("players");
    const [draftActions, setDraftActions] = useState([]);

    const allTeamFixtures = useAllTeamFixtures();

    const playersRef = useRef(players);
    useEffect(() => {
        playersRef.current = players;
    }, [players]);

    const draftGameweekId = initialWindowState?.gameWeekId > 0
        ? initialWindowState.gameWeekId
        : nextGameweek?.id;

    const refreshDraftSquad = useCallback(async () => {
        if (!isDraftMode || !draftGameweekId || !user?.id) return;
        try {
            setDraftSquad(await fetchSquadForGameweek(user.id, draftGameweekId));
        } catch (error) {
            console.error("Failed to refresh draft squad:", error);
        }
    }, [draftGameweekId, isDraftMode, user?.id]);

    const refreshDraftHistory = useCallback(async () => {
        if (!isDraftMode || !draftGameweekId) return;
        try {
            const actions = await fetchTransferHistory(draftGameweekId);
            setDraftActions((actions || []).filter(action => action.windowType === "DRAFT"));
        } catch (error) {
            console.error("Failed to refresh draft history:", error);
        }
    }, [draftGameweekId, isDraftMode]);

    useEffect(() => {
        void refreshDraftSquad();
        void refreshDraftHistory();
    }, [refreshDraftHistory, refreshDraftSquad]);

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

    useEffect(() => {
        if (!connected) return;

        const handleTransferEvent = (event) => {
            if (event.event === "window_opened") {
                setIsWindowOpen(true);
                setCurrentTurnUserId(event.userId);
                setInitialOrder(event.initialOrder || []);
                setTurnOrder(event.turnOrder || []);
                setTurnsUsed(event.turnsUsed || {});
                if (event.totalTurns) setTotalTurnsMap(event.totalTurns);
                setIsIrRound(false);
            }

            if (event.event === "window_closed") {
                setIsWindowOpen(false);
                setCurrentTurnUserId(null);
            }

            if (event.event === "turn_started") {
                setCurrentTurnUserId(event.userId);
                if (event.turnOrder) setTurnOrder(event.turnOrder);
                if (event.turnsUsed) setTurnsUsed(event.turnsUsed);
                if (event.roundType) {
                    setIsIrRound(event.roundType === "IR");
                }
            }

            if (event.event === "ir_round_started") {
                setIsWindowOpen(true);
                setCurrentTurnUserId(event.userId);
                setLastTransferMessage(null);
                if (event.turnOrder) setTurnOrder(event.turnOrder);
                setIrPosition(event.irPosition);
                if (event.turnsUsed) setTurnsUsed(event.turnsUsed);
                setIsIrRound(true);
            }

            if (event.event === "transfer_done") {
                const { userId, playerOutId, playerInId, userName } = event;

                setPlayers(prev => prev.map(p => {
                    if (p.id === playerInId) return { ...p, available: false, ownerId: userId };
                    if (p.id === playerOutId) return { ...p, available: true, ownerId: null };
                    return p;
                }));

                setTurnsUsed(prev => ({
                    ...prev,
                    [userId]: (prev[userId] || 0) + 1
                }));

                const currentPlayers = playersRef.current;
                const playerIn = currentPlayers.find(p => p.id === playerInId);
                const inName = playerIn ? playerIn.viewName : "Player In";
                const playerOut = currentPlayers.find(p => p.id === playerOutId);
                const outName = playerOut ? playerOut.viewName : "Player Out";

                setLastTransferMessage(isDraftMode
                    ? `${userName || "User"} drafted ${inName}`
                    : `${userName || "User"} signed ${inName} | over ${outName}`);

                if (isDraftMode && userId === user.id) {
                    void refreshDraftSquad();
                }
                if (isDraftMode) void refreshDraftHistory();
            }

            if (event.event === "turn_passed") {
                setLastTransferMessage(`${event.userName || "User"} passed his turn!`);
            }
        };

        if (!user.leagueId) return;
        const topic = `/topic/leagues/${user.leagueId}/transfers`;
        return subscribe(topic, handleTransferEvent);

    }, [connected, isDraftMode, refreshDraftHistory, refreshDraftSquad, subscribe, user.id, user.leagueId, setPlayers]);

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
                                    onClick={async () => {
                                        try {
                                            await passTurn(user.id);
                                        } catch (err) {
                                            console.error("Error passing turn:", err);
                                            alert(err.message);
                                        }
                                    }}
                                >
                                    Pass Turn
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
                        <button onClick={async () => {
                            try {
                                await makeDraftPick(selectedPlayerIn.id);
                                await refreshDraftSquad();
                                setSelectedPlayerIn(null);
                            } catch (error) {
                                alert(error.message);
                            }
                        }}>Confirm pick</button>
                        <button onClick={() => setSelectedPlayerIn(null)}>Cancel</button>
                    </div>
                ) : (
                    <ReplacementModal
                        playerIn={selectedPlayerIn}
                        user={user}
                        setUser={() => { }}
                        players={players}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                )
            )}
        </div>
    );
}

export default TransferWindow;
