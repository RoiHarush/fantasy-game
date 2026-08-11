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
    onWaiverEntriesSave,
    waiverDirty = false,
    waiverSaving = false,
    waiverMessage = "",
    waiverGameweekId,
    irWaiverEntries = [],
    onIrWaiverEntriesChange,
    onIrWaiverEntriesSave,
    irWaiverDirty = false,
    irWaiverSaving = false,
    irWaiverMessage = "",
    draftedContent = null,
    previewMode = false,
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeButton, setActiveButton] = useState("All players");
    const [positionFilter, setPositionFilter] = useState("All");
    const [teamFilter, setTeamFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Points");
    const [showAvailable, setShowAvailable] = useState(false);

    const [comparePlayers, setComparePlayers] = useState([]);
    const [filterByPosition, setFilterByPosition] = useState(null);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [waiverCandidate, setWaiverCandidate] = useState(null);
    const [waiverPlanType, setWaiverPlanType] = useState("REGULAR");

    const watchlistQuery = useWatchlist();
    const playersById = useMemo(() => new Map(players.map((player) => [String(player.id), player])), [players]);
    const squadPlayerIds = useMemo(() => [
        ...Object.values(squad?.startingLineup || {}).flat(),
        ...Object.values(squad?.bench || {})
    ].filter(Boolean), [squad]);
    const irPlayer = squad?.irId ? playersById.get(String(squad.irId)) : null;
    const eligibleOutgoing = waiverCandidate
        ? squadPlayerIds
            .map((id) => playersById.get(String(id)))
            .filter(player => player?.position === waiverCandidate.position)
        : [];
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
        positionFilter,
        teamFilter,
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
                positionFilter={positionFilter}
                setPositionFilter={setPositionFilter}
                teamFilter={teamFilter}
                setTeamFilter={setTeamFilter}
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
                <div className="mx-2 mt-2 flex flex-wrap items-center justify-center gap-1.5 rounded-control border border-app-accent-border bg-app-accent-surface p-2 text-center text-[0.68rem] leading-snug text-app-accent-foreground sm:mx-4 sm:mt-4 sm:gap-2 sm:p-3 sm:text-sm">
                    Select another <strong>{filterByPosition}</strong> to compare with{" "}
                    <strong>{comparePlayers[0].viewName}</strong>.
                    <button type="button" className="rounded-full border border-app-accent-border px-2 py-0.5 text-[0.65rem] font-bold transition hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-app-accent sm:px-3 sm:py-1 sm:text-sm" onClick={handleCloseCompare}>
                        Cancel
                    </button>
                </div>
            )}

            {activeButton === "Drafted" && draftedContent ? draftedContent : activeButton === "Waivers" ? (
                <WaiverPlanPanel
                    entries={waiverPlanType === "IR" ? irWaiverEntries : waiverEntries}
                    playersById={playersById}
                    onChange={waiverPlanType === "IR" ? onIrWaiverEntriesChange : onWaiverEntriesChange}
                    onSave={waiverPlanType === "IR" ? onIrWaiverEntriesSave : onWaiverEntriesSave}
                    hasChanges={waiverPlanType === "IR" ? irWaiverDirty : waiverDirty}
                    saving={waiverPlanType === "IR" ? irWaiverSaving : waiverSaving}
                    message={waiverPlanType === "IR" ? irWaiverMessage : waiverMessage}
                    gameWeekId={waiverGameweekId}
                    planType={waiverPlanType}
                    onPlanTypeChange={setWaiverPlanType}
                    hasIrPlan={Boolean(onIrWaiverEntriesChange)}
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
                    onToggleWatch={previewMode ? () => {} : (playerId) => watchlistQuery.toggleWatch(
                        playerId,
                        watchlistQuery.watchlist.some((id) => String(id) === String(playerId)),
                    )}
                    watchlistUpdating={previewMode ? false : watchlistQuery.isUpdating}
                    onWaiverSelect={onWaiverEntriesChange ? player => {
                        setWaiverCandidate(player);
                    } : undefined}
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
                    irPlayer={irPlayer}
                    irEntries={irWaiverEntries}
                    onIrChange={onIrWaiverEntriesChange}
                    saving={waiverSaving || irWaiverSaving}
                    onClose={() => setWaiverCandidate(null)}
                />
            )}
        </div>
    );
}

export default PlayersWrapper;
