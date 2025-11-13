import { useEffect, useState } from "react";
import Style from "../../../Styles/TransferWindow.module.css";
import { usePlayers } from "../../../Context/PlayersContext";
import ReplacementModal from "./ReplacementModal";
import { useWebSocket } from "../../../Context/WebSocketContext";
import API_URL from "../../../config";
import ClosedWindow from "./ClosedWindow";
import IRSignModal from "./IRSignModal";
import PlayersWrapper from "../../General/PlayersWrapper";

function TransferWindow({ initialUser }) {
    const [user, setUser] = useState(initialUser);
    const { players, setPlayers } = usePlayers();
    const [selectedPlayerIn, setSelectedPlayerIn] = useState(null);
    const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
    const [lastTransferMessage, setLastTransferMessage] = useState(null);
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const { subscribe, unsubscribe, connected } = useWebSocket();
    const [irPosition, setIrPosition] = useState(null);
    const [turnOrder, setTurnOrder] = useState([]);
    const [turnsUsed, setTurnsUsed] = useState({});
    const [maxTurns, setMaxTurns] = useState(2);
    const [initialOrder, setInitialOrder] = useState([]);


    const isDataReady = allUsers.length > 0 && initialOrder.length > 0;


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
        fetch(`${API_URL}/api/transfer-window/state`)
            .then(res => res.json())
            .then(data => {
                if (data.isOpen) {
                    setIsWindowOpen(true);
                    setCurrentTurnUserId(data.currentUserId);

                    if (Array.isArray(data.initialOrder)) {
                        setInitialOrder([...new Set(data.initialOrder)]);
                    }

                    if (Array.isArray(data.order)) {
                        setTurnOrder(data.order);
                    }

                    if (data.turnsUsed) setTurnsUsed(data.turnsUsed);
                    if (data.maxTurns) setMaxTurns(data.maxTurns);

                    console.log("🔁 Joined existing window | Current turn:", data.currentUserId);
                } else {
                    setIsWindowOpen(false);
                    console.log("🚪 Window currently closed");
                }
            })
            .catch(err => console.error("Failed to fetch transfer window state:", err));
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/api/users`)
            .then(res => res.json())
            .then(data => setAllUsers(data))
            .catch(err => console.error("Failed to load users:", err));
    }, []);

    useEffect(() => {
        if (!connected) return;

        const handleTransferEvent = (event) => {
            console.log("📩 Transfer event received:", event);

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
                console.log("🪟 Transfer window opened — first user:", event.userId);
                return;
            }

            if (event.event === "window_closed") {
                setIsWindowOpen(false);
                setCurrentTurnUserId(null);
                console.log("🚪 Transfer window closed — switching to ClosedWindow view");
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
                console.log("⚕️ IR Round started | Position:", event.irPosition);
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
                const { userId, userName } = event;
                setLastTransferMessage(`${userName || "User"} passed his turn!`);
                console.log("⏩ Turn passed by:", userName);
                return;
            }

            if (event.event === "info_message") {
                if (event.userId === user.id) {
                    setLastTransferMessage(event.message);
                    console.log("📢 Info message for me:", event.message);
                } else {
                    console.log("ℹ️ Info message for user", event.userId, ":", event.message);
                }
                return;
            }

        };

        subscribe("/topic/transfers", handleTransferEvent);
        return () => unsubscribe("/topic/transfers");
    }, [connected, setPlayers, players]);

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
                                onClick={() => {
                                    fetch(`${API_URL}/api/transfer-window/pass?userId=${user.id}`, {
                                        method: "POST",
                                    })
                                        .then((res) => {
                                            if (!res.ok) throw new Error("Failed to pass turn");
                                            console.log("Turn passed successfully");
                                        })
                                        .catch((err) => console.error("Error passing turn:", err));
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
                        setUser={setUser}
                        players={players}
                        onClose={() => setSelectedPlayerIn(null)}
                    />
                )
            )}
        </div>
    );
}

export default TransferWindow;