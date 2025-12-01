import Switcher from "./Switcher";
import Style from "../../Styles/ScoutWrapper.module.css";
import { useTeams } from "../../Context/TeamsContext";

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
    disablePositionOptions
}) {
    const { teams } = useTeams();

    return (
        <div className={Style.controls}>
            <div className={Style.controlsTop}>
                <div className={Style.search}>
                    <h3>Search</h3>
                    <input
                        type="text"
                        placeholder="Search players"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={Style.filtersWrapper}>
                    <div className={Style.view}>
                        <h3>View</h3>
                        <select
                            value={viewFilter}
                            onChange={(e) => setViewFilter(e.target.value)}
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

                    </div>

                    <div className={Style.sort}>
                        <h3>Sort</h3>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="Points">Sort by Points</option>
                            <option value="Name">Sort by Name</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={Style.switchButtons}>
                <Switcher
                    active={activeButton}
                    options={["All players", "Watchlist"]}
                    onChange={setActiveButton}
                />
            </div>

            <div className={Style.statusRow}>
                <div className={Style.message}>
                    <span className={Style.playersCount}>{filteredCount}</span>
                    <span> players shown</span>
                </div>

                <div className={Style.availableButton}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showAvailable}
                            onChange={(e) => setShowAvailable(e.target.checked)}
                        />
                        <span className={Style["checkbox-message"]}>Show available</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default ControlsBar;
