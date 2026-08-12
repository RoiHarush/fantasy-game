import { Search, SlidersHorizontal } from "lucide-react";

import SelectField from "../../shared/ui/SelectField";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";
import Switcher from "./Switcher";

function ControlsBar({
    searchQuery,
    setSearchQuery,
    positionFilter,
    setPositionFilter,
    teamFilter,
    setTeamFilter,
    sortBy,
    setSortBy,
    activeButton,
    setActiveButton,
    showAvailable,
    setShowAvailable,
    filteredCount,
    disablePositionOptions,
    teams,
    extraView = null,
    showWaivers = false
}) {
    const switcherOptions = [
        "All players",
        "Watchlist",
        ...(extraView ? [extraView.key] : []),
        ...(showWaivers ? ["Waivers"] : []),
    ];

    return (
        <div className="border-b border-app-border bg-app-surface-elevated px-3 py-4 sm:px-5">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_minmax(10rem,0.38fr)_minmax(11rem,0.42fr)_minmax(11rem,0.4fr)]">
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
                        <SlidersHorizontal aria-hidden="true" size={15} /> Position
                    </span>
                        <SelectField
                            ariaLabel="Filter players by position"
                            value={positionFilter}
                            onValueChange={setPositionFilter}
                            options={[
                                { value: "All", label: "All positions" },
                                { value: "GK", label: "Goalkeepers", disabled: disablePositionOptions },
                                { value: "DEF", label: "Defenders", disabled: disablePositionOptions },
                                { value: "MID", label: "Midfielders", disabled: disablePositionOptions },
                                { value: "FWD", label: "Forwards", disabled: disablePositionOptions },
                            ]}
                            className="bg-app-surface"
                        />
                </label>

                <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-app-muted">Club</span>
                    <SelectField
                        ariaLabel="Filter players by club"
                        value={teamFilter}
                        onValueChange={setTeamFilter}
                        options={[
                            { value: "All", label: "All clubs" },
                            ...teams.map((team) => ({
                                value: team.id,
                                label: team.name,
                                icon: <TeamLogo team={team} className="size-5 md:size-5" />,
                            })),
                        ]}
                        className="bg-app-surface"
                    />
                </label>

                <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-app-muted">Sort</span>
                        <SelectField
                            ariaLabel="Sort players"
                            value={sortBy}
                            onValueChange={setSortBy}
                            options={[
                                { value: "Points", label: "Sort by Points" },
                                { value: "Name", label: "Sort by Name" },
                            ]}
                            className="bg-app-surface"
                        />
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
                        ...(extraView ? {
                            [extraView.key]: {
                                mobile: extraView.mobileLabel,
                                desktop: extraView.desktopLabel,
                            },
                        } : {}),
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
