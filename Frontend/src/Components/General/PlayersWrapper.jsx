import { useState } from "react";
import PlayerTable from "../Pages/ScoutTab//PlayersTable";
import Switcher from "./Switcher";
import Style from "../../Styles/ScoutWrapper.module.css";
import teams from "../../MockData/Teams";

function PlayersWrapper({ players, user, setUser, mode = "scout" }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeButton, setActiveButton] = useState("All players");
    const [viewFilter, setViewFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Points");
    const [showAvailable, setShowAvailable] = useState(false);

    let basePlayers = [...players];

    if (mode === "draft") {
        basePlayers = basePlayers.filter((p) => p.available);
    }

    if (activeButton === "Watchlist") {
        basePlayers = basePlayers.filter((p) => user.watchedPlayers.includes(p.id));
    }

    let filteredPlayers = basePlayers.filter((p) =>
        p.viewName.toLowerCase().startsWith(searchQuery.toLowerCase())
    );

    if (viewFilter !== "All") {
        if (["GK", "DEF", "MID", "FWD"].includes(viewFilter)) {
            filteredPlayers = filteredPlayers.filter((p) => p.position === viewFilter);
        } else if (viewFilter.startsWith("Team")) {
            const teamNumber = parseInt(viewFilter.replace("Team", ""), 10);
            filteredPlayers = filteredPlayers.filter((p) => p.team === teamNumber);
        }
    }

    if (sortBy === "Points") {
        filteredPlayers.sort((a, b) => b.points - a.points);
    } else if (sortBy === "Name") {
        filteredPlayers.sort((a, b) => a.viewName.localeCompare(b.viewName));
    }

    if (mode === "scout") {
        if (showAvailable) {
            filteredPlayers = filteredPlayers.filter((p) => p.available);
        }
    }

    return (
        <div className={Style.scoutWrapper}>
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

                    <div className={Style.view}>
                        <h3>View</h3>
                        <select
                            value={viewFilter}
                            onChange={(e) => setViewFilter(e.target.value)}
                        >
                            <option value="All">All positions</option>
                            <option value="GK">Goalkeepers</option>
                            <option value="DEF">Defenders</option>
                            <option value="MID">Midfielders</option>
                            <option value="FWD">Forwards</option>
                            {mode === "scout" && <option disabled>──────────</option>}
                            {mode === "scout" &&
                                teams.map((team) => (
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

                <div className={Style.switchButtons}>
                    <Switcher
                        active={activeButton}
                        options={["All players", "Watchlist"]}
                        onChange={setActiveButton}
                    />
                </div>

                <div className={Style.statusRow}>
                    <div className={Style.message}>
                        <span className={Style.playersCount}>{filteredPlayers.length}</span>
                        <span>{mode === "draft" ? " players available" : " players shown"}</span>
                    </div>

                    {mode === "scout" && (
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
                    )}
                </div>
            </div>

            <div className={Style.tableWrapper}>
                <PlayerTable
                    user={user}
                    players={filteredPlayers}
                    setUser={setUser}
                    mode={mode}
                />
            </div>
        </div>
    );
}

export default PlayersWrapper;
