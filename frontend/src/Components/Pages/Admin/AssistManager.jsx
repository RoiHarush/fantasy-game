import { useMemo, useState } from "react";
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../features/players/usePlayers';
import { useGameweek } from '../../../features/gameweeks/useGameweek';
import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useAdminAssists } from "../../../features/league-admin/useLeagueAdmin";

const AssistManager = ({ maintenanceLeagueId = null }) => {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const gameweekState = useGameweek();
    const { currentGameweek } = gameweekState;

    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const gameweek = selectedGameweek ?? currentGameweek?.id;
    const { query: assistersQuery, mutation: updateAssist } = useAdminAssists(maintenanceLeagueId, gameweek);
    const assisters = assistersQuery.data ?? [];

    const isCurrentGW = currentGameweek && gameweek === currentGameweek.id;
    const isPastGW = currentGameweek && gameweek < currentGameweek.id;

    const canEdit = isPastGW || (isCurrentGW && currentGameweek.calculated);

    const searchResults = useMemo(() => {
        return findPlayers(players, searchTerm);
    }, [players, searchTerm]);

    const handleUpdate = (playerId, action) => {
        if (!canEdit) return;
        updateAssist.mutate(
            { playerId, action },
            { onSuccess: () => setSearchTerm("") },
        );
    };

    const styles = {
        headerCard: {
            backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', textAlign: 'center', position: 'relative'
        },
        lockedBadge: {
            display: 'inline-block', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: 'bold',
            padding: '4px 12px', borderRadius: '20px', marginBottom: '8px', border: '1px solid #fecaca'
        },
        select: {
            marginTop: '10px', width: '100%', padding: '12px', borderRadius: '10px',
            border: '1px solid #e5e7eb', fontSize: '1rem', backgroundColor: '#f9fafb', outline: 'none'
        },
        searchContainer: { marginBottom: '1.5rem', position: 'relative' },
        searchInput: {
            width: '100%', padding: '14px 16px 14px 45px', borderRadius: '12px', border: 'none',
            fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', outline: 'none',
        },
        searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' },
        card: {
            backgroundColor: 'white', borderRadius: '16px', padding: '1rem', marginBottom: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6'
        },
        playerInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
        controls: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '12px' },
        roundBtn: {
            width: '32px', height: '32px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        dropdown: {
            position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 50, overflow: 'hidden'
        },
        dropdownItem: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6'
        },
        addBtn: {
            backgroundColor: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '8px',
            border: 'none', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer'
        }
    };

    return (
        <div>
            <div style={styles.headerCard}>
                {!canEdit && <div style={styles.lockedBadge}>🔒 LOCKED</div>}

                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111827' }}>Assist Manager</h2>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px' }}>
                    Update stats for Gameweek {gameweek}
                </div>
                <select
                    aria-label="Assists gameweek"
                    style={styles.select}
                    value={gameweek || ''}
                    onChange={(e) => setSelectedGameweek(Number(e.target.value))}
                >
                    {[...Array(currentGameweek ? currentGameweek.id : 1)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Gameweek {i + 1}</option>
                    ))}
                </select>
            </div>

            <div style={styles.searchContainer}>
                <svg style={styles.searchIcon} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    aria-label="Search player for assist adjustment"
                    placeholder={canEdit ? "Search player..." : "Gameweek is locked"}
                    style={{ ...styles.searchInput, opacity: canEdit ? 1 : 0.6, cursor: canEdit ? 'text' : 'not-allowed' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!canEdit}
                />
                {searchResults.length > 0 && (
                    <div style={styles.dropdown}>
                        {searchResults.map(player => (
                            <div key={player.id} style={styles.dropdownItem}>
                                <div style={styles.playerInfo}>
                                    <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} style={{ width: '35px', height: '35px' }} />
                                    <span style={{ fontWeight: '600' }}>{player.viewName}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleUpdate(player.id, "ADD")}
                                    style={{ ...styles.addBtn, opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                    disabled={!canEdit}
                                >
                                    + Add
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                {(playersQuery.error || assistersQuery.error || updateAssist.error || gameweekState.error) && (
                    <p role="alert">
                        {playersQuery.error?.message || assistersQuery.error?.message || updateAssist.error?.message || gameweekState.error}
                    </p>
                )}
                {(playersQuery.isPending || assistersQuery.isPending || gameweekState.loading) ? <div role="status" style={{ textAlign: 'center', padding: '20px' }}>Loading...</div> : (
                    <>
                        {assisters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', backgroundColor: 'white', borderRadius: '16px' }}>
                                No assists recorded yet.
                            </div>
                        ) : (
                            assisters.map((item) => {
                                const realPlayer = players.find((player) => String(player.id) === String(item.playerId));
                                const position = realPlayer ? realPlayer.position : "MID";

                                return (
                                    <div key={item.playerId} style={styles.card}>
                                        <div style={styles.playerInfo}>
                                            <PlayerKit
                                                teamId={item.teamId}
                                                type={position === "GK" ? "gk" : "field"}
                                                style={{ width: '45px', height: '45px' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '1rem' }}>{item.viewName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Assists</div>
                                            </div>
                                        </div>

                                        <div style={styles.controls}>
                                            <button
                                                type="button"
                                                aria-label={`Remove one assist from ${item.viewName}`}
                                                onClick={() => handleUpdate(item.playerId, "REMOVE")}
                                                disabled={!canEdit}
                                                style={{ ...styles.roundBtn, backgroundColor: 'white', color: '#ef4444', opacity: canEdit ? 1 : 0.5 }}
                                            >-</button>

                                            <span style={{ fontSize: '1.2rem', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>
                                                {item.numOfAssist}
                                            </span>

                                            <button
                                                type="button"
                                                aria-label={`Add one assist to ${item.viewName}`}
                                                onClick={() => handleUpdate(item.playerId, "ADD")}
                                                disabled={!canEdit}
                                                style={{ ...styles.roundBtn, backgroundColor: '#3b82f6', color: 'white', opacity: canEdit ? 1 : 0.5 }}
                                            >+</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AssistManager;
