import { useMemo, useState } from "react";
import { useFilteredPlayers } from "../../hooks/useFilteredPlayers";
import PlayerTable from "../Pages/ScoutTab/PlayersTable";
import ControlsBar from "./ControlsBar";
import CompareModal from "./CompareModal";
import WaiverPlanPanel from "../Pages/ScoutTab/WaiverPlanPanel";
import WaiverCandidateDialog from "../Pages/ScoutTab/WaiverCandidateDialog";
import { useWatchlist } from "../../features/watchlist/useWatchlist";

function PlayersWrapper({
    user,
    players,
    teams,
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
    waiverGameweekId,
    draftedContent = null
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

    const watchlistQuery = useWatchlist();
    const playersById = useMemo(() => new Map(players.map((player) => [String(player.id), player])), [players]);
    const squadPlayerIds = useMemo(() => [
        ...Object.values(squad?.startingLineup || {}).flat(),
        ...Object.values(squad?.bench || {})
    ].filter(Boolean), [squad]);
    const eligibleOutgoing = waiverCandidate
        ? squadPlayerIds
            .map((id) => playersById.get(String(id)))
            .filter(player => player?.position === waiverCandidate.position)
        : [];
    const plannedIncomingIds = useMemo(
        () => new Set(waiverEntries.map(entry => entry.playerInId)),
        [waiverEntries]
    );
    const watchedPlayerIds = useMemo(
        () => new Set(watchlistQuery.watchlist.map(String)),
        [watchlistQuery.watchlist],
    );

    const handleCompare = (player) => {
        if (comparePlayers.length === 0) {
            setComparePlayers([player]);
            setFilterByPosition(player.position);
        }
        else if (comparePlayers.length === 1) {
            if (player.position !== comparePlayers[0].position) return;
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
        players,
        watchlist: watchlistQuery.watchlist,
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
        <div className="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface text-app-foreground shadow-panel">
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
                teams={teams}
                showDrafted={Boolean(draftedContent)}
                showWaivers={mode === "scout" && Boolean(onWaiverEntriesChange)}
            />

            {watchlistQuery.error && (
                <p className="mx-4 mt-4 rounded-control border border-app-danger-border bg-app-danger-surface p-3 text-sm text-app-danger-foreground" role="alert">
                    The watchlist could not be updated.
                </p>
            )}

            {comparePlayers.length === 1 && (
                <div className="mx-4 mt-4 flex flex-wrap items-center justify-center gap-2 rounded-control border border-app-accent-border bg-app-accent-surface p-3 text-center text-sm text-app-accent-foreground">
                    Select another <strong>{filterByPosition}</strong> to compare with{" "}
                    <strong>{comparePlayers[0].viewName}</strong>.
                    <button type="button" className="rounded-full border border-app-accent-border px-3 py-1 font-bold transition hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-app-accent" onClick={handleCloseCompare}>
                        Cancel
                    </button>
                </div>
            )}

            {activeButton === "Drafted" && draftedContent ? draftedContent : activeButton === "Waivers" ? (
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
                    teams={teams}
                    disabledPlayerIds={disabledPlayerIds}
                    watchedPlayerIds={watchedPlayerIds}
                    onToggleWatch={(playerId) => watchlistQuery.toggleWatch(
                        playerId,
                        watchlistQuery.watchlist.some((id) => String(id) === String(playerId)),
                    )}
                    watchlistUpdating={watchlistQuery.isUpdating}
                    onWaiverSelect={onWaiverEntriesChange ? player => {
                        setWaiverCandidate(player);
                    } : undefined}
                    plannedIncomingIds={plannedIncomingIds}
                />
            )}

            {showCompareModal && (
                <CompareModal players={comparePlayers} onClose={handleCloseCompare} />
            )}

            {waiverCandidate && (
                <WaiverCandidateDialog
                    candidate={waiverCandidate}
                    eligibleOutgoing={eligibleOutgoing}
                    entries={waiverEntries}
                    onChange={onWaiverEntriesChange}
                    saving={waiverSaving}
                    onClose={() => setWaiverCandidate(null)}
                />
            )}
        </div>
    );
}

export default PlayersWrapper;
