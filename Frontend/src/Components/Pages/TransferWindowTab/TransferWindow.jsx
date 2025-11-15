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
    const [turnsUsed, setTurnsUsed] = useState(initialWindowState?.turnsUsed || {});
    const [maxTurns, setMaxTurns] = useState(initialWindowState?.maxTurns || 2);
    const [initialOrder, setInitialOrder] = useState(initialWindowState?.initialOrder || []);
    const { subscribe, unsubscribe, connected } = useWebSocket();
    const [irPosition, setIrPosition] = useState(null);

    const isDataReady = allUsers.length > 0 && (initialOrder.length > 0 || turnOrder.length > 0);

    function turnsUntilMyTurn() {
        if (!turnOrder.length || !currentTurnUserId) return null;
        const currentIndex = turnOrder.indexOf(currentTurnUserId);
        const myIndex = turnOrder.indexOf(user.id);
        if (currentIndex === -1 || myIndex === -1) return null;
        const diff = myIndex - currentIndex;
        const turnsLeft = diff >= 0 ? diff : turnOrder.length + diff;
        if (turnsLeft === 0) return 0;
        return turnsLeft;
    }

    useEffect(() => {
        if (!connected) return;

        const handleTransferEvent = (event) => {
            if (event.event === "window_opened") {
                setIsWindowOpen(true);
                setCurrentTurnUserId(event.userId);
                if (Array.isArray(event.initialOrder) && initialOrder.length === 0) {
                    setInitialOrder([...new Set(event.initialOrder)]);
                }
                if (Array.isArray(event.turnOrder)) {
                    setTurnOrder(event.turnOrder);
                }
                if (event.turnsUsed) setTurnsUsed(event.turnsUsed);
                if (event.maxTurns) setMaxTurns(event.maxTurns);
                return;
            }

            if (event.event === "window_closed") {
                setIsWindowOpen(false);
                setCurrentTurnUserId(null);
                return;
            }

            if (event.event === "turn_started") {
                setCurrentTurnUserId(event.userId);
                if (Array.isArray(event.turnOrder)) setTurnOrder(event.turnOrder);
                if (event.turnsUsed) setTurnsUsed(event.turnsUsed);
                if (event.maxTurns) setMaxTurns(event.maxTurns);
                return;
            }

            if (event.event === "ir_round_started") {
                setIsWindowOpen(true);
                setCurrentTurnUserId(event.userId);
                if (Array.isArray(event.turnOrder)) setTurnOrder(event.turnOrder);
                setIrPosition(event.irPosition);
                if (event.turnsUsed) setTurnsUsed(event.turnsUsed);
                if (event.maxTurns) setMaxTurns(event.maxTurns);
                return;
            }

            if (event.event === "transfer_done") {
                const { userId, playerOutId, playerInId, userName } = event;
                setPlayers(prev =>
                    prev.map(p => {
                        if (p.id === playerInId)
                            return { ...p, available: false, ownerId: userId };
                        if (p.id === playerOutId)
                            return { ...p, available: true, ownerId: null };
                        return p;
                    })
                );

                const playerIn = players.find(p => p.id === playerInId);
                const playerOut = players.find(p => p.id === playerOutId);
                const inName = playerIn ? playerIn.viewName : "Unknown";
                const outName = playerOut ? playerOut.viewName : "Unknown";
                setLastTransferMessage(`${userName || "User"} signed ${inName} (replaced ${outName})`);
                return;
            }

            if (event.event === "turn_passed") {
                const { userName } = event;
                setLastTransferMessage(`${userName || "User"} passed his turn!`);
                return;
            }

            if (event.event === "info_message") {
                if (event.userId === user.id) {
                    setLastTransferMessage(event.message);
                }
                return;
            }
        };

        subscribe("/topic/transfers", handleTransferEvent);
        return () => unsubscribe("/topic/transfers");
    }, [connected, subscribe, unsubscribe, setPlayers, players, user, initialOrder.length]);

    if (!players || players.length === 0) return <div>Loading players...</div>;

    function getUserNameById(id) {
        const found = allUsers.find(u => u.id === id);
        return found ? found.name : `User #${id}`;
    }

    if (!isWindowOpen) {
        return (
            <div>
                <ClosedWindow />
            </div>
        );
    }

    const displayedOrder = initialOrder.length ? initialOrder : turnOrder;

    return (
        <div className={Style.transferPage}>
            <h2 className={Style.title}>Transfer Window</h2>

            <div className={Style.roundHeader}>
                <div className={Style.roundInfo}>
                    <span className={`${Style.roundBadge} ${irPosition ? Style.irBadge : Style.regularBadge}`}>
                        {irPosition ? "IR Round" : "Regular Round"}
                    </span>
                    <span className={Style.roundSubtitle}>
                        {isDataReady ? `${displayedOrder.length} managers | ${Object.keys(turnsUsed).length} active` : "Loading..."}
                    </span>
                </div>

                <div className={Style.turnsList}>
                    {displayedOrder.map((id) => {
                        const userName = getUserNameById(id);
                        const used = turnsUsed[id] || 0;
                        const done = used >= maxTurns;
                        const isCurrent = id === currentTurnUserId;

                        return (
                            <div
                                key={id}
                                className={`${Style.turnCard} 
                                    ${done ? Style.done : ""} 
                                    ${isCurrent ? Style.current : ""}`}
                            >
                                <div className={Style.userName}>{userName}</div>
                                <div className={Style.turnProgress}>
                                    <div
                                        className={Style.turnBarFill}
                                        style={{ width: `${(used / maxTurns) * 100}%` }}
                                    />
                                </div>
                                <div className={Style.turnCount}>
                                    {used}/{maxTurns} {done && "✅"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={Style.turnBar}>
                <div className={Style.turnContent}>
                    {currentTurnUserId === user.id ? (
                        <>
                            <span className={Style.myTurn}>Your turn to make a transfer</span>
                            <button
                                className={Style.passButton}
                                onClick={async () => {
                                    try {
                                        await passTurn(user.id);
                                    } catch (err) {
                                        console.error("Error passing turn:", err);
                                    }
                                }}
                            >
                                Pass Turn
                            </button>
                        </>
                    ) : currentTurnUserId ? (
                        <span className={Style.otherTurn}>
                            Waiting for <strong>{getUserNameById(currentTurnUserId)}</strong> to make a transfer
                        </span>
                    ) : (
                        <span className={Style.otherTurn}>Waiting for window to start…</span>
                    )}
                </div>

                {currentTurnUserId !== user.id && turnsUntilMyTurn() !== null && (
                    <div className={Style.turnHint}>
                        {turnsUntilMyTurn() === 1
                            ? "You're next!"
                            : `Your turn in ${turnsUntilMyTurn()} turns`}
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
                irPosition={irPosition}
            />

            {selectedPlayerIn && (
                irPosition ? (
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
