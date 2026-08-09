import { Search, SlidersHorizontal } from "lucide-react";

import Switcher from "./Switcher";

function ControlsBar({
    searchQuery,
    setSearchQuery,
    viewFilter,
    setViewFilter,
    sortBy,
    setSortBy,
    activeButton,
    setActiveButton,
    showAvailable,
    setShowAvailable,
    filteredCount,
    disablePositionOptions,
    teams,
    showDrafted = false,
    showWaivers = false
}) {
    const switcherOptions = [
        "All players",
        "Watchlist",
        ...(showDrafted ? ["Drafted"] : []),
        ...(showWaivers ? ["Waivers"] : []),
    ];

    return (
        <div className="border-b border-app-border bg-app-surface-elevated px-3 py-4 sm:px-5">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.42fr)_minmax(12rem,0.42fr)]">
                <label className="min-w-0">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-app-muted">
                        <Search aria-hidden="true" size={15} /> Search
                    </span>
                    <input
                        type="search"
                        aria-label="Search players"
                        placeholder="Search players"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-control border border-app-border bg-app-surface px-3 text-sm text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-3 focus:ring-app-accent/20"
                    />
                </label>

                <label className="min-w-0">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-app-muted">
                        <SlidersHorizontal aria-hidden="true" size={15} /> View
                    </span>
                        <select
                            aria-label="Filter players"
                            value={viewFilter}
                            onChange={(e) => setViewFilter(e.target.value)}
                            className="h-11 w-full rounded-control border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-foreground outline-none transition focus:border-app-accent focus:ring-3 focus:ring-app-accent/20"
                        >
                            <option value="All">All positions</option>
                            <option value="GK" disabled={disablePositionOptions}>Goalkeepers</option>
                            <option value="DEF" disabled={disablePositionOptions}>Defenders</option>
                            <option value="MID" disabled={disablePositionOptions}>Midfielders</option>
                            <option value="FWD" disabled={disablePositionOptions}>Forwards</option>

                            {teams.map((team) => (
                                <option key={team.id} value={`Team${team.id}`}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                </label>

                <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-app-muted">Sort</span>
                        <select
                            aria-label="Sort players"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-11 w-full rounded-control border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-foreground outline-none transition focus:border-app-accent focus:ring-3 focus:ring-app-accent/20"
                        >
                            <option value="Points">Sort by Points</option>
                            <option value="Name">Sort by Name</option>
                        </select>
                </label>
            </div>

            <div className="mt-4 flex justify-center">
                <Switcher
                    active={activeButton}
                    options={switcherOptions}
                    onChange={setActiveButton}
                    labels={{
                        "All players": { mobile: "All", desktop: "All players" },
                        Watchlist: { mobile: "Watch", desktop: "Watchlist" },
                        Waivers: { mobile: "WVR", desktop: "Waivers" },
                        Drafted: { mobile: "Draft", desktop: "Drafted" },
                    }}
                />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-3">
                <p className="text-sm text-app-muted">
                    <strong className="text-base text-app-accent-foreground">{filteredCount}</strong> players shown
                </p>

                <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-app-foreground">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={showAvailable}
                        onChange={(e) => setShowAvailable(e.target.checked)}
                    />
                    <span className="relative h-6 w-11 shrink-0 rounded-full border border-app-border bg-app-surface-muted transition after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-app-muted after:transition peer-checked:border-app-accent peer-checked:bg-app-accent-surface peer-checked:after:translate-x-5 peer-checked:after:bg-app-accent peer-focus-visible:ring-3 peer-focus-visible:ring-app-accent/25" />
                    <span className="sm:hidden">Available</span>
                    <span className="hidden sm:inline">Show available</span>
                    <span className={`min-w-6 rounded-full px-1 py-0.5 text-center text-[0.58rem] font-extrabold uppercase ${showAvailable ? "bg-app-accent-surface text-app-accent-foreground" : "bg-app-surface-muted text-app-muted"}`}>
                        {showAvailable ? "On" : "Off"}
                    </span>
                </label>
            </div>
        </div>
    );
}

export default ControlsBar;
