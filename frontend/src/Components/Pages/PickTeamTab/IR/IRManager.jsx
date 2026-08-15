import { useState } from "react";
import IRModal from "./IRModal";
import ConfirmIRModal from "./ConfirmIRModal";
import IRReleaseModal from "./IRReleaseModal";
import { countSquadPlayers, getIrChipUnavailableReason } from "../../../../features/pick-team/model";
import { useIrChip } from "../../../../features/pick-team/usePickTeamActions";
import ChipCard from "../ChipCard";
import { showChipError } from "../chipFeedback";

function IRManager({
    userId,
    gameweekId,
    squad,
    setSquad,
    chips,
    setChips,
    transferWindowProcessed,
    refreshPlayerData,
    players,
    hasUnsavedChanges = false,
    squadSavePending = false,
}) {
    const [showIRModal, setShowIRModal] = useState(false);
    const [confirmIRPlayer, setConfirmIRPlayer] = useState(null);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [confirmReleasePlayer, setConfirmReleasePlayer] = useState(null);
    const irPlayer = players.find((player) => String(player.id) === String(squad.irId));
    const irMutation = useIrChip({
        userId,
        gameweekId,
        onSuccess: ({ updatedSquad, updatedChips }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
            if (refreshPlayerData) void refreshPlayerData();
        },
        onError: (error) => showChipError(error, "Could not update the IR Chip."),
        onSettled: () => {
            setConfirmIRPlayer(null);
            setConfirmReleasePlayer(null);
            setShowIRModal(false);
            setShowReleaseModal(false);
        },
    });

    const isActive = chips.active?.IR === true;
    const playersCount = countSquadPlayers(squad);
    const unavailableReason = getIrChipUnavailableReason({
        isActive,
        remaining: chips.remaining?.IR,
        playersCount,
        transferWindowProcessed,
        hasUnsavedChanges,
        savePending: squadSavePending,
    });

    const openIRModal = () => setShowIRModal(true);
    const openReleaseModal = () => setShowReleaseModal(true);

    const handleConfirmAssign = (player) => irMutation.mutate({ mode: "assign", playerId: player.id });
    const handleConfirmRelease = (player) => irMutation.mutate({ mode: "release", playerId: player.id });

    return (
        <>
            <ChipCard
                icon="/Icons/ir-chip.svg"
                iconAlt="IR chip"
                title="IR Chip"
                actionLabel={isActive ? "Release" : unavailableReason ? "Unavailable" : "Play"}
                onAction={isActive ? openReleaseModal : openIRModal}
                disabled={Boolean(unavailableReason)}
                active={isActive}
                actionTitle={unavailableReason || (isActive ? "Release IR Player" : "Play IR Chip")}
                message={unavailableReason}
                remaining={chips.remaining?.IR ?? 0}
                total={2}
            />

            {showIRModal && (
                <IRModal
                    squad={squad}
                    players={players}
                    firstPickCaptainActive={chips.active?.FIRST_PICK_CAPTAIN === true}
                    onSelect={(player) => {
                        setConfirmIRPlayer(player);
                        setShowIRModal(false);
                    }}
                    onClose={() => setShowIRModal(false)}
                />
            )}

            {confirmIRPlayer && (
                <ConfirmIRModal
                    confirmIRPlayer={confirmIRPlayer}
                    onConfirm={handleConfirmAssign}
                    onCancel={() => setConfirmIRPlayer(null)}
                    isActive={false}
                    pending={irMutation.isPending}
                />
            )}

            {showReleaseModal && (
                <IRReleaseModal
                    squad={squad}
                    players={players}
                    irPlayer={irPlayer}
                    onClose={() => setShowReleaseModal(false)}
                    onConfirm={(selected) => setConfirmReleasePlayer(selected)}
                    setSquad={setSquad}
                />
            )}

            {confirmReleasePlayer && (
                <ConfirmIRModal
                    confirmIRPlayer={confirmReleasePlayer}
                    onConfirm={handleConfirmRelease}
                    onCancel={() => setConfirmReleasePlayer(null)}
                    isActive={true}
                    irPlayer={irPlayer}
                    pending={irMutation.isPending}
                />
            )}
        </>
    );
}

export default IRManager;
