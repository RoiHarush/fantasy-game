import { useEffect, useState } from "react";
import Style from "../../../Styles/TransferWindow.module.css";
import { usePlayers } from "../../../Context/PlayersContext";
import ReplacementModal from "./ReplacementModal";
import { useWebSocket } from "../../../Context/WebSocketContext";
import ClosedWindow from "./ClosedWindow";
import IRSignModal from "./IRSignModal";
import PlayersWrapper from "../../General/PlayersWrapper";
import { passTurn } from "../../../services/transferWindowService";

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

    const { subscribe, unsubscribe, connected } = useWebSocket();

    const [isIrRound, setIsIrRound] = useState(initialWindowState?.currentRound === 'IR');
    const [irPosition, setIrPosition] = useState(null);

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

                if (event.turnOrder && event.turnOrder.length > 0) {
                    setTurnOrder(event.turnOrder);
                }

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

                const playerIn = players.find(p => p.id === playerInId);
                const inName = playerIn ? playerIn.viewName : "Player In";
                const playerOut = players.find(p => p.id === playerOutId)
                const outName = playerOut ? playerOut.viewName : "Player Out"
                setLastTransferMessage(`${userName || "User"} signed ${inName} | over ${outName}`);
            }

            if (event.event === "turn_passed") {
                setLastTransferMessage(`${event.userName || "User"} passed his turn!`);
            }
        };

        subscribe("/topic/transfers", handleTransferEvent);
        return () => unsubscribe("/topic/transfers");
    }, [connected, subscribe, unsubscribe, setPlayers, players, user]);

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
            <h2 className={Style.title}>Transfer Window</h2>

            <div className={Style.roundHeader}>
                <div className={Style.roundInfo}>
                    <span className={`${Style.roundBadge} ${isIrRound ? Style.irBadge : Style.regularBadge}`}>
                        {isIrRound ? "IR Round" : "Regular Round"}
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
                                    : "Your turn to make a transfer"}
                            </span>

                            {!isIrRound && (
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

            <PlayersWrapper
                user={user}
                mode="transfer"
                onPlayerSelect={setSelectedPlayerIn}
                currentTurnUserId={currentTurnUserId}
                irPosition={isIrRound ? irPosition : null}
            />

            {selectedPlayerIn && (
                isIrRound ? (
                    <IRSignModal
                        player={selectedPlayerIn}
                        user={user}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
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