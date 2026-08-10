import { useState } from "react";
import IRModal from "./IRModal";
import ConfirmIRModal from "./ConfirmIRModal";
import IRReleaseModal from "./IRReleaseModal";
import { countSquadPlayers } from "../../../../features/pick-team/model";
import { useIrChip } from "../../../../features/pick-team/usePickTeamActions";
import ChipCard from "../ChipCard";

function IRManager({ userId, gameweekId, squad, setSquad, chips, setChips, transferWindowProcessed, refreshPlayerData, players }) {
    const [showIRModal, setShowIRModal] = useState(false);
    const [confirmIRPlayer, setConfirmIRPlayer] = useState(null);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [confirmReleasePlayer, setConfirmReleasePlayer] = useState(null);
    const [message, setMessage] = useState("");
    const irPlayer = players.find((player) => String(player.id) === String(squad.irId));
    const irMutation = useIrChip({
        userId,
        gameweekId,
        onSuccess: ({ updatedSquad, updatedChips }, { mode }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
            if (refreshPlayerData) void refreshPlayerData();
            setMessage(mode === "assign" ? "IR assigned successfully." : "IR released successfully.");
        },
        onError: (error) => {
            setMessage(error.message || "Unexpected error while processing IR.");
        },
        onSettled: () => {
            setConfirmIRPlayer(null);
            setConfirmReleasePlayer(null);
            setShowIRModal(false);
            setShowReleaseModal(false);
        },
    });

    const isActive = chips.active?.IR === true;
    const isUsedUp = chips.remaining?.IR <= 0;

    const playersCount = countSquadPlayers(squad);


    const isReleaseDisabled = playersCount < 15 || transferWindowProcessed;

    const isPlayDisabled = isUsedUp || transferWindowProcessed;


    const getReleaseTitle = () => {
        if (transferWindowProcessed) return "Cannot release IR after deadline";
        if (playersCount < 15) return "Squad must be full (15 players) to release IR";
        return "Release IR Player";
    };

    const getPlayTitle = () => {
        if (transferWindowProcessed) return "Cannot assign IR after deadline";
        if (isUsedUp) return "Unavailable";
        return "Play IR Chip";
    };

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
                actionLabel={isActive ? "Release" : isUsedUp ? "Unavailable" : "Play"}
                onAction={isActive ? openReleaseModal : openIRModal}
                disabled={isActive ? isReleaseDisabled : isPlayDisabled}
                active={isActive}
                actionTitle={isActive ? getReleaseTitle() : getPlayTitle()}
                message={message}
            />

            {showIRModal && (
                <IRModal
                    squad={squad}
                    players={players}
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
