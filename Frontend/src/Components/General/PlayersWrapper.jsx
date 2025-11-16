import { useState } from "react";
import { useFilteredPlayers } from "../../hooks/useFilteredPlayers";
import PlayerTable from "../Pages/ScoutTab/PlayersTable";
import ControlsBar from "./ControlsBar";
import Style from "../../Styles/ScoutWrapper.module.css";
import CompareModal from "./CompareModal";

function PlayersWrapper({ user, mode = "scout", onPlayerSelect, currentTurnUserId, irPosition }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeButton, setActiveButton] = useState("All players");
    const [viewFilter, setViewFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Points");
    const [showAvailable, setShowAvailable] = useState(false);

    const [comparePlayers, setComparePlayers] = useState([]);
    const [filterByPosition, setFilterByPosition] = useState(null);
    const [showCompareModal, setShowCompareModal] = useState(false);

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

            <PlayerTable
                user={user}
                players={visiblePlayers}
                mode={mode}
                onPlayerSelect={onPlayerSelect}
                currentTurnUserId={currentTurnUserId}
                onCompare={handleCompare}
                comparePlayers={comparePlayers}
            />

            {showCompareModal && (
                <CompareModal players={comparePlayers} onClose={handleCloseCompare} />
            )}
        </div>
    );
}

export default PlayersWrapper;