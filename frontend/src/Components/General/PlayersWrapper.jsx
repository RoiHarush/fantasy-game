import { useMemo, useState } from "react";
import { useFilteredPlayers } from "../../hooks/useFilteredPlayers";
import PlayerTable from "../Pages/ScoutTab/PlayersTable";
import ControlsBar from "./ControlsBar";
import Style from "../../Styles/ScoutWrapper.module.css";
import CompareModal from "./CompareModal";
import Portal from "../../Portal";
import WaiverPlanPanel from "../Pages/ScoutTab/WaiverPlanPanel";
import WaiverStyle from "../../Styles/WaiverScout.module.css";
import { usePlayers } from "../../features/players/usePlayers";

function PlayersWrapper({
    user,
    mode = "scout",
    onPlayerSelect,
    currentTurnUserId,
    irPosition,
    allTeamFixtures,
    disabledPlayerIds,
    squad,
    waiverEntries = [],
    onWaiverEntriesChange,
    waiverSaving = false,
    waiverMessage = "",
    waiverGameweekId
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeButton, setActiveButton] = useState("All players");
    const [viewFilter, setViewFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Points");
    const [showAvailable, setShowAvailable] = useState(false);

    const [comparePlayers, setComparePlayers] = useState([]);
    const [filterByPosition, setFilterByPosition] = useState(null);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [waiverCandidate, setWaiverCandidate] = useState(null);
    const [waiverPlayerOutId, setWaiverPlayerOutId] = useState("");

    const { players } = usePlayers();
    const playersById = useMemo(() => new Map(players.map(player => [player.id, player])), [players]);
    const squadPlayerIds = useMemo(() => [
        ...Object.values(squad?.startingLineup || {}).flat(),
        ...Object.values(squad?.bench || {})
    ].filter(Boolean), [squad]);
    const eligibleOutgoing = waiverCandidate
        ? squadPlayerIds
            .map(id => playersById.get(id))
            .filter(player => player?.position === waiverCandidate.position)
        : [];
    const plannedIncomingIds = useMemo(
        () => new Set(waiverEntries.map(entry => entry.playerInId)),
        [waiverEntries]
    );

    const handleCompare = (player) => {
        if (comparePlayers.length === 0) {
            setComparePlayers([player]);
            setFilterByPosition(player.position);
        }
        else if (comparePlayers.length === 1) {
            if (player.position !== comparePlayers[0].position) {
                alert("You can only compare players from the same position.");
                return;
            }
            setComparePlayers((prev) => [...prev, player]);
            setShowCompareModal(true);
        }
    };

    const handleCloseCompare = () => {
        setComparePlayers([]);
        setFilterByPosition(null);
        setShowCompareModal(false);
    };

    const filteredPlayers = useFilteredPlayers({
        activeButton,
        searchQuery,
        viewFilter,
        sortBy,
        showAvailable,
        irPosition
    });

    const visiblePlayers = filterByPosition
        ? filteredPlayers.filter((p) => p.position === filterByPosition)
        : filteredPlayers;

    return (
        <div className={Style.scoutWrapper}>
            <ControlsBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewFilter={viewFilter}
                setViewFilter={setViewFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                activeButton={activeButton}
                setActiveButton={setActiveButton}
                showAvailable={showAvailable}
                setShowAvailable={setShowAvailable}
                filteredCount={visiblePlayers.length}
                disablePositionOptions={comparePlayers.length === 1}
                showWaivers={mode === "scout" && Boolean(onWaiverEntriesChange)}
            />


            {comparePlayers.length === 1 && (
                <div className={Style.compareBanner}>
                    Select another <strong>{filterByPosition}</strong> to compare with{" "}
                    <strong>{comparePlayers[0].viewName}</strong>.
                    <button className={Style.cancelCompare} onClick={handleCloseCompare}>
                        Cancel
                    </button>
                </div>
            )}

            {activeButton === "Waivers" ? (
                <WaiverPlanPanel
                    entries={waiverEntries}
                    playersById={playersById}
                    onChange={onWaiverEntriesChange}
                    saving={waiverSaving}
                    message={waiverMessage}
                    gameWeekId={waiverGameweekId}
                />
            ) : (
                <PlayerTable
                    user={user}
                    players={visiblePlayers}
                    mode={mode}
                    onPlayerSelect={onPlayerSelect}
                    currentTurnUserId={currentTurnUserId}
                    onCompare={handleCompare}
                    comparePlayers={comparePlayers}
                    allTeamFixtures={allTeamFixtures}
                    disabledPlayerIds={disabledPlayerIds}
                    onWaiverSelect={onWaiverEntriesChange ? player => {
                        setWaiverCandidate(player);
                        setWaiverPlayerOutId("");
                    } : undefined}
                    plannedIncomingIds={plannedIncomingIds}
                />
            )}

            {showCompareModal && (
                <CompareModal players={comparePlayers} onClose={handleCloseCompare} />
            )}

            {waiverCandidate && (
                <Portal>
                    <div className={WaiverStyle.modalBackdrop} onClick={() => setWaiverCandidate(null)}>
                        <div className={WaiverStyle.modal} onClick={event => event.stopPropagation()}>
                            <h3>Add {waiverCandidate.viewName} to waivers</h3>
                            <p>Choose the {waiverCandidate.position} player who should leave your squad.</p>
                            <select value={waiverPlayerOutId} onChange={event => setWaiverPlayerOutId(event.target.value)}>
                                <option value="">Choose outgoing player</option>
                                {eligibleOutgoing.map(player => (
                                    <option key={player.id} value={player.id}>{player.viewName}</option>
                                ))}
                            </select>
                            <div className={WaiverStyle.modalActions}>
                                <button type="button" onClick={() => setWaiverCandidate(null)}>Cancel</button>
                                <button
                                    type="button"
                                    disabled={!waiverPlayerOutId || waiverSaving}
                                    onClick={async () => {
                                        const entry = {
                                            playerInId: waiverCandidate.id,
                                            playerOutId: Number(waiverPlayerOutId)
                                        };
                                        if (!waiverEntries.some(item => item.playerInId === entry.playerInId && item.playerOutId === entry.playerOutId)) {
                                            await onWaiverEntriesChange([...waiverEntries, entry]);
                                        }
                                        setWaiverCandidate(null);
                                    }}
                                >Add priority</button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}

export default PlayersWrapper;
