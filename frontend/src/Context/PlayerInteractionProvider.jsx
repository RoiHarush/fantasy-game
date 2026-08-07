import { createContext, useContext, useState } from "react";
import PlayerMatchModal from "../Components/General/PlayerMatchModal";
import PlayerActionModal from "../Components/General/PlayerActionModal";
import PlayerInfoModal from "../Components/General/PlayerInfoModal";
import {
    applySquadSwap,
    assignCaptain,
    assignViceCaptain,
    getAllowedSwapIds,
} from "../features/pick-team/squadModel";

const PlayerInteractionContext = createContext();

export function PlayerInteractionProvider({
    mode,          // "pick" | "points"
    squad,         // pick mode only
    setSquad,      // pick mode only
    setIsDirty,    // pick mode only
    players,       // pick + points
    chips,         // pick mode only
    gameweek,      // points mode only
    user,          // pick + points
    children
}) {

    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [disabledIds, setDisabledIds] = useState([]);

    const [modalType, setModalType] = useState(null);
    // "action" | "match" | "info"
    const [modalPlayer, setModalPlayer] = useState(null);

    // ============================
    // GENERAL CLICK HANDLER
    // ============================
    const handlePlayerClick = (playerId) => {
        if (mode === "points") return handlePointsClick(playerId);
        if (mode === "pick") return handlePickClick(playerId);
    };

    // ============================
    // POINTS MODE LOGIC
    // ============================
    const handlePointsClick = (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        setModalType("match");
        setModalPlayer(player);
    };

    // ============================
    // PICK MODE LOGIC
    // ============================
    const handlePickClick = (playerId) => {
        // CASE 1: Already selecting someone → try to swap
        if (selectedPlayerId) {
            if (selectedPlayerId === playerId) {
                setSelectedPlayerId(null);
                setDisabledIds([]);
                return;
            }

            setSquad(applySquadSwap(squad, selectedPlayerId, playerId, players));

            setIsDirty(true);
            setSelectedPlayerId(null);
            setDisabledIds([]);
            return;
        }

        // CASE 2: No selected player → open action modal
        const player = players.find(p => p.id === playerId);
        if (player) {
            setModalType("action");
            setModalPlayer(player);
        }
    };

    // ============================
    // ACTIONS FROM PICK TEAM MODAL
    // ============================
    const switchPlayer = (playerId) => {
        // Enter switch mode
        setModalPlayer(null);
        setModalType(null);

        setSelectedPlayerId(playerId);

        const allowed = getAllowedSwapIds(squad, playerId, players, chips?.active?.FIRST_PICK_CAPTAIN);
        const allIds = Object.values(squad.startingLineup).flat().concat(Object.values(squad.bench));

        setDisabledIds(allIds.filter(id => id !== playerId && !allowed.includes(id)));
    };

    const setCaptain = (playerId) => {
        setSquad((previousSquad) => assignCaptain(previousSquad, playerId));
        setIsDirty(true);

        setModalType(null);
        setModalPlayer(null);
    };

    const setVice = (playerId) => {
        setSquad((previousSquad) => assignViceCaptain(previousSquad, playerId));
        setIsDirty(true);

        setModalType(null);
        setModalPlayer(null);
    };

    const viewInfo = (player) => {
        setModalType("info");
        setModalPlayer(player);
    };

    const closeModal = () => {
        setModalType(null);
        setModalPlayer(null);
    };

    return (
        <PlayerInteractionContext.Provider
            value={{
                handlePlayerClick,
                selectedPlayerId,
                disabledIds,
                closeModal
            }}
        >

            {children}

            {/* POINTS MODE MODAL */}
            {modalType === "match" && mode === "points" && (
                <PlayerMatchModal
                    player={modalPlayer}
                    gameweek={gameweek}
                    user={user}
                    onClose={closeModal}
                    onViewInfo={viewInfo}
                />

            )}

            {/* PICK MODE ACTION MODAL */}
            {modalType === "action" && mode === "pick" && (
                <PlayerActionModal
                    player={modalPlayer}
                    squad={squad}
                    onClose={closeModal}
                    onSwitch={switchPlayer}
                    onSetCaptain={setCaptain}
                    onSetVice={setVice}
                    onViewInfo={viewInfo}
                    isCaptain={squad.captainId === modalPlayer.id}
                    isVice={squad.viceCaptainId === modalPlayer.id}
                    canBeCaptain={
                        !Object.values(squad.bench).includes(modalPlayer.id) &&
                        modalPlayer.id !== squad.firstPickId
                    }
                    firstPickUsed={chips?.active?.FIRST_PICK_CAPTAIN}
                />
            )}

            {/* INFO MODAL — SHARED */}
            {modalType === "info" && (
                <PlayerInfoModal
                    player={modalPlayer}
                    onClose={closeModal}
                />
            )}

        </PlayerInteractionContext.Provider>
    );
}

export function usePlayerInteraction() {
    return useContext(PlayerInteractionContext);
}
