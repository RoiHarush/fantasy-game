import { useState, useMemo } from "react";
import IRModal from "./IRModal";
import ConfirmIRModal from "./ConfirmIRModal";
import IRReleaseModal from "./IRReleaseModal";
import Style from "../../../../Styles/PickTeam.module.css";
import { usePlayers } from "../../../../features/players/usePlayers";
import { countSquadPlayers } from "../../../../features/pick-team/model";
import { useIrChip } from "../../../../features/pick-team/usePickTeamActions";

function IRManager({ userId, gameweekId, squad, setSquad, chips, setChips, transferWindowProcessed, refreshPlayerData }) {
    const [showIRModal, setShowIRModal] = useState(false);
    const [confirmIRPlayer, setConfirmIRPlayer] = useState(null);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [confirmReleasePlayer, setConfirmReleasePlayer] = useState(null);
    const { players } = usePlayers();
    const irMutation = useIrChip({
        userId,
        gameweekId,
        onSuccess: ({ updatedSquad, updatedChips }, { mode }) => {
            setSquad(updatedSquad);
            setChips(updatedChips);
            if (refreshPlayerData) void refreshPlayerData();
            alert(mode === "assign" ? "IR assigned successfully!" : "IR released successfully!");
        },
        onError: (error) => {
            console.error("IR mutation failed:", error);
            alert(error.message || "Unexpected error while processing IR");
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

    const playersCount = useMemo(() => countSquadPlayers(squad), [squad]);


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
        <div className={Style.chipCard}>
            <img
                src="/Icons/ir-chip.svg"
                alt="IR Chip Icon"
                className={Style.chipIcon}
            />
            <div className={Style.chipTitle}>IR Chip</div>

            {isActive ? (
                <button
                    className={`${Style.chipButton} ${Style.active}`}
                    onClick={openReleaseModal}
                    disabled={isReleaseDisabled}
                    title={getReleaseTitle()}
                >
                    Release
                </button>
            ) : (
                <button
                    className={Style.chipButton}
                    onClick={openIRModal}
                    disabled={isPlayDisabled}
                    title={getPlayTitle()}
                >
                    {isUsedUp ? "Unavailable" : "Play"}
                </button>
            )}

            {showIRModal && (
                <IRModal
                    squad={squad}
                    isActive={isActive}
                    setConfirmIRPlayer={setConfirmIRPlayer}
                    setShowIRModal={setShowIRModal}
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
                    irPlayer={players.find(p => p.id === squad.irId)}
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
                    pending={irMutation.isPending}
                />
            )}
        </div>
    );
}

export default IRManager;
