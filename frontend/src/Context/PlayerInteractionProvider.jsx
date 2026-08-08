"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PlayerMatchModal from "../Components/General/PlayerMatchModal";
import PlayerActionModal from "../Components/General/PlayerActionModal";
import PlayerInfoModal from "../Components/General/PlayerInfoModal";
import {
    applySquadSwap,
    assignCaptain,
    assignViceCaptain,
    getAllowedSwapIds,
} from "../features/pick-team/squadModel";

const PlayerInteractionContext = createContext(null);

const isSameId = (firstId, secondId) => String(firstId) === String(secondId);

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
    const handlePointsClick = useCallback((playerId) => {
        const player = players.find((item) => isSameId(item.id, playerId));
        if (!player) return;

        setModalType("match");
        setModalPlayer(player);
    }, [players]);

    // ============================
    // PICK MODE LOGIC
    // ============================
    const handlePickClick = useCallback((playerId) => {
        // CASE 1: Already selecting someone → try to swap
        if (selectedPlayerId !== null) {
            if (isSameId(selectedPlayerId, playerId)) {
                setSelectedPlayerId(null);
                setDisabledIds([]);
                return;
            }

            setSquad((previousSquad) => (
                applySquadSwap(previousSquad, selectedPlayerId, playerId, players)
            ));

            setIsDirty?.(true);
            setSelectedPlayerId(null);
            setDisabledIds([]);
            return;
        }

        // CASE 2: No selected player → open action modal
        const player = players.find((item) => isSameId(item.id, playerId));
        if (player) {
            setModalType("action");
            setModalPlayer(player);
        }
    }, [players, selectedPlayerId, setIsDirty, setSquad]);

    const handlePlayerClick = useCallback((playerId) => {
        if (mode === "points") handlePointsClick(playerId);
        if (mode === "pick") handlePickClick(playerId);
    }, [handlePickClick, handlePointsClick, mode]);

    // ============================
    // ACTIONS FROM PICK TEAM MODAL
    // ============================
    const switchPlayer = useCallback((playerId) => {
        // Enter switch mode
        setModalPlayer(null);
        setModalType(null);

        setSelectedPlayerId(playerId);

        const allowed = getAllowedSwapIds(squad, playerId, players, chips?.active?.FIRST_PICK_CAPTAIN);
        const allIds = Object.values(squad.startingLineup).flat().concat(Object.values(squad.bench));

        setDisabledIds(allIds.filter((id) => (
            !isSameId(id, playerId)
            && !allowed.some((allowedId) => isSameId(allowedId, id))
        )));
    }, [chips?.active?.FIRST_PICK_CAPTAIN, players, squad]);

    const setCaptain = useCallback((playerId) => {
        setSquad((previousSquad) => assignCaptain(previousSquad, playerId));
        setIsDirty?.(true);

        setModalType(null);
        setModalPlayer(null);
    }, [setIsDirty, setSquad]);

    const setVice = useCallback((playerId) => {
        setSquad((previousSquad) => assignViceCaptain(previousSquad, playerId));
        setIsDirty?.(true);

        setModalType(null);
        setModalPlayer(null);
    }, [setIsDirty, setSquad]);

    const viewInfo = useCallback((player) => {
        setModalType("info");
        setModalPlayer(player);
    }, []);

    const closeModal = useCallback(() => {
        setModalType(null);
        setModalPlayer(null);
    }, []);

    const contextValue = useMemo(() => ({
        handlePlayerClick,
        selectedPlayerId,
        disabledIds,
        closeModal,
    }), [closeModal, disabledIds, handlePlayerClick, selectedPlayerId]);

    return (
        <PlayerInteractionContext.Provider
            value={contextValue}
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
                    isCaptain={isSameId(squad.captainId, modalPlayer.id)}
                    isVice={isSameId(squad.viceCaptainId, modalPlayer.id)}
                    canBeCaptain={
                        !Object.values(squad.bench).some((id) => isSameId(id, modalPlayer.id)) &&
                        !isSameId(modalPlayer.id, squad.firstPickId)
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
    const context = useContext(PlayerInteractionContext);
    if (!context) {
        throw new Error("usePlayerInteraction must be used inside PlayerInteractionProvider");
    }
    return context;
}
