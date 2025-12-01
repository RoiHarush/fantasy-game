import { useState } from "react";
import IRModal from "./IRModal";
import ConfirmIRModal from "./ConfirmIRModal";
import IRReleaseModal from "./IRReleaseModal";
import Style from "../../../../Styles/PickTeam.module.css";
import API_URL from "../../../../config";
import { usePlayers } from "../../../../Context/PlayersContext";
import { getAuthHeaders } from "../../../../services/authHelper";


function IRManager({ userId, squad, setSquad, chips, setChips }) {
    const [showIRModal, setShowIRModal] = useState(false);
    const [confirmIRPlayer, setConfirmIRPlayer] = useState(null);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [confirmReleasePlayer, setConfirmReleasePlayer] = useState(null);
    const { players } = usePlayers();

    const isActive = chips.active?.IR === true;
    const isUsedUp = chips.remaining?.IR <= 0;

    const openIRModal = () => setShowIRModal(true);
    const openReleaseModal = () => setShowReleaseModal(true);

    const handleConfirmAssign = async (player) => {
        try {
            const res = await fetch(
                `${API_URL}/api/teams/${userId}/chips/ir?playerId=${player.id}`,
                {
                    method: "POST",
                    headers: getAuthHeaders()
                }
            );

            if (!res.ok) {
                const msg = await res.text();
                alert(`Failed to assign IR: ${msg}`);
                return;
            }

            const updatedSquad = await res.json();
            setSquad(updatedSquad);
            alert(`IR assigned successfully!`);

            const chipRes = await fetch(`${API_URL}/api/teams/${userId}/chips`, {
                headers: getAuthHeaders()
            });
            if (chipRes.ok) {
                const updatedChips = await chipRes.json();
                setChips(updatedChips);
            }

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
            const res = await fetch(
                `${API_URL}/api/teams/${userId}/chips/ir/release?playerOutId=${playerOut.id}`,
                {
                    method: "POST",
                    headers: getAuthHeaders()
                }
            );

            if (!res.ok) {
                const msg = await res.text();
                alert(`Failed to release IR: ${msg}`);
                return;
            }

            const updatedSquad = await res.json();
            setSquad(updatedSquad);
            alert(`IR released successfully!`);

            const chipRes = await fetch(`${API_URL}/api/teams/${userId}/chips`, {
                headers: getAuthHeaders()
            });
            if (chipRes.ok) {
                const updatedChips = await chipRes.json();
                setChips(updatedChips);
            }

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
                >
                    Release
                </button>
            ) : (
                <button
                    className={Style.chipButton}
                    onClick={openIRModal}
                    disabled={isUsedUp}
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