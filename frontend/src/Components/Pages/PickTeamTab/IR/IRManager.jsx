import { useState, useMemo } from "react";
import IRModal from "./IRModal";
import ConfirmIRModal from "./ConfirmIRModal";
import IRReleaseModal from "./IRReleaseModal";
import Style from "../../../../Styles/PickTeam.module.css";
import { usePlayers } from "../../../../Context/PlayersContext";
import { apiRequest } from "../../../../services/apiClient";

function IRManager({ userId, squad, setSquad, chips, setChips, transferWindowProcessed, refreshPlayerData }) {
    const [showIRModal, setShowIRModal] = useState(false);
    const [confirmIRPlayer, setConfirmIRPlayer] = useState(null);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [confirmReleasePlayer, setConfirmReleasePlayer] = useState(null);
    const { players } = usePlayers();

    const isActive = chips.active?.IR === true;
    const isUsedUp = chips.remaining?.IR <= 0;

    const playersCount = useMemo(() => {
        if (!squad) return 0;
        let count = 0;
        if (squad.startingLineup) {
            Object.values(squad.startingLineup).forEach((playersArray) => {
                if (Array.isArray(playersArray)) {
                    count += playersArray.length;
                }
            });
        }
        if (squad.bench) {
            Object.values(squad.bench).forEach((playerId) => {
                if (playerId) count += 1;
            });
        }
        return count;
    }, [squad]);


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

    const handleConfirmAssign = async (player) => {
        try {
            const updatedSquad = await apiRequest(`/api/teams/${userId}/chips/ir?playerId=${player.id}`, {
                method: "POST",
            });
            setSquad(updatedSquad);
            alert(`IR assigned successfully!`);

            const updatedChips = await apiRequest(`/api/teams/${userId}/chips`);
            setChips(updatedChips);

            if (refreshPlayerData) await refreshPlayerData();

        } catch (err) {
            console.error("IR request failed:", err);
            alert("Unexpected error while processing IR");
        } finally {
            setConfirmIRPlayer(null);
            setShowIRModal(false);
        }
    };

    const handleConfirmRelease = async (playerOut) => {
        try {
            const updatedSquad = await apiRequest(`/api/teams/${userId}/chips/ir/release?playerOutId=${playerOut.id}`, {
                method: "POST",
            });
            setSquad(updatedSquad);
            alert(`IR released successfully!`);

            const updatedChips = await apiRequest(`/api/teams/${userId}/chips`);
            setChips(updatedChips);

            if (refreshPlayerData) await refreshPlayerData();

        } catch (err) {
            console.error("IR release failed:", err);
            alert("Unexpected error while releasing IR");
        } finally {
            setConfirmReleasePlayer(null);
            setShowReleaseModal(false);
        }
    };

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
                />
            )}
        </div>
    );
}

export default IRManager;