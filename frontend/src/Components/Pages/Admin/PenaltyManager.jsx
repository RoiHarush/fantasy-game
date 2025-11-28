import React, { useState, useEffect } from 'react';
import { AdminService } from '../../../services/adminService';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../Context/PlayersContext';
import { useGameweek } from '../../../Context/GameweeksContext';

const PenaltyManager = () => {
    const { players } = usePlayers();
    const { currentGameweek } = useGameweek();

    const [gameweek, setGameweek] = useState();

    const [punishedPlayers, setPunishedPlayers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const isCurrentGW = currentGameweek && gameweek === currentGameweek.id;
    const isPastGW = currentGameweek && gameweek < currentGameweek.id;

    const canEdit = isPastGW || (isCurrentGW && currentGameweek.calculated);

    useEffect(() => {
        if (currentGameweek && currentGameweek.id) {
            setGameweek(currentGameweek.id);
        }
    }, [currentGameweek]);

    useEffect(() => {
        loadPunishedPlayers();
    }, [gameweek]);

    useEffect(() => {
        if (searchTerm.length < 2 || !players) {
            setSearchResults([]);
        } else {
            const results = players.filter(p =>
                p.viewName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.firstName && p.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.lastName && p.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
            ).slice(0, 5);
            setSearchResults(results);
        }
    }, [searchTerm, players]);

    const loadPunishedPlayers = async () => {
        if (!gameweek) return;

        setLoading(true);
        try {
            const data = await AdminService.getPenaltiesConceded(gameweek);
            setPunishedPlayers(data);
        } catch (error) {
            console.error("Error loading penalties", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePunish = async (playerId, action) => {
        if (!canEdit) {
            alert("Cannot edit penalties for uncalculated gameweek!");
            return;
        }

        try {
            const updatedPlayer = await AdminService.updatePenaltyConceded(playerId, gameweek, action);

            setPunishedPlayers(prev => {
                const exists = prev.find(p => p.playerId === updatedPlayer.playerId);

                if (updatedPlayer.penaltiesConceded === 0) {
                    return prev.filter(p => p.playerId !== updatedPlayer.playerId);
                }

                if (exists) {
                    return prev.map(p => p.playerId === updatedPlayer.playerId ? updatedPlayer : p);
                } else {
                    return [...prev, updatedPlayer];
                }
            });

            if (searchTerm) {
                setSearchTerm("");
                setSearchResults([]);
            }

        } catch (error) {
            alert("Failed to update penalty");
        }
    };

    const styles = {
        container: {
            minHeight: '80vh',
            backgroundColor: '#f9fafb',
            padding: '2rem',
            fontFamily: 'sans-serif',
        },
        wrapper: { maxWidth: '800px', margin: '0 auto' },
        headerCard: {
            backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb',
            borderLeft: '4px solid #ef4444'
        },
        title: { fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: 0 },
        subtitle: { fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' },
        select: {
            appearance: 'none', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', color: '#111827',
            padding: '0.6rem 2.5rem 0.6rem 1rem', fontSize: '0.875rem', borderRadius: '0.5rem',
            cursor: 'pointer', fontWeight: '500', outline: 'none'
        },

        searchContainer: { marginBottom: '2rem', position: 'relative' },
        searchInput: {
            width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #e5e7eb',
            fontSize: '1rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white',
            opacity: canEdit ? 1 : 0.6,
            cursor: canEdit ? 'text' : 'not-allowed'
        },
        dropdown: {
            position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', zIndex: 50, overflow: 'hidden'
        },
        dropdownItem: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem',
            borderBottom: '1px solid #f3f4f6'
        },

        listTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        listCard: {
            backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb', overflow: 'hidden'
        },
        row: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem', borderBottom: '1px solid #f3f4f6'
        },
        punishBtn: {
            backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px',
            fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
        },
        removeBtn: {
            width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e5e7eb', backgroundColor: 'white',
            color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        },
        disabled: { opacity: 0.5, cursor: 'not-allowed' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>

                <div style={styles.headerCard}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={styles.title}>Penalty Manager</h2>
                            {!canEdit && (
                                <span style={{
                                    fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b',
                                    padding: '2px 8px', borderRadius: '9999px', border: '1px solid #fecaca', fontWeight: 'bold'
                                }}>
                                    Locked
                                </span>
                            )}
                        </div>
                        <p style={styles.subtitle}>GW {gameweek} • Manually Assign Penalties</p>
                    </div>

                    <div>
                        <select
                            value={gameweek}
                            onChange={(e) => setGameweek(Number(e.target.value))}
                            style={styles.select}
                        >
                            {[...Array(currentGameweek ? currentGameweek.id : 1)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Gameweek {i + 1}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={styles.searchContainer}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder={canEdit ? "Search player to punish..." : "Gameweek is locked..."}
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!canEdit}
                    />

                    {searchResults.length > 0 && (
                        <div style={styles.dropdown}>
                            {searchResults.map(player => (
                                <div key={player.id} style={styles.dropdownItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <PlayerKit teamId={player.teamId} type="field" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{player.viewName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{player.firstName} {player.lastName}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePunish(player.id, "ADD")}
                                        style={{ ...styles.punishBtn, ...(!canEdit ? styles.disabled : {}) }}
                                        disabled={!canEdit}
                                    >
                                        Conceded Penalty (-2)
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {punishedPlayers.length > 0 && (
                    <div>
                        <div style={styles.listTitle}>
                            <span>Punished Players</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#6b7280', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '12px' }}>
                                {punishedPlayers.length}
                            </span>
                        </div>

                        <div style={styles.listCard}>
                            {punishedPlayers.map((item) => (
                                <div key={item.playerId} style={styles.row}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <PlayerKit teamId={item.teamId} type="field" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{item.viewName}</h3>
                                            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600' }}>
                                                {item.penaltiesConceded} Penalty Conceded ({item.penaltiesConceded * -2} pts)
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => handlePunish(item.playerId, "ADD")}
                                            style={{ ...styles.removeBtn, color: '#10b981', borderColor: '#10b981', ...(!canEdit ? styles.disabled : {}) }}
                                            disabled={!canEdit}
                                            title="Add another penalty"
                                        >
                                            +
                                        </button>

                                        <button
                                            onClick={() => handlePunish(item.playerId, "REMOVE")}
                                            style={{ ...styles.removeBtn, ...(!canEdit ? styles.disabled : {}) }}
                                            disabled={!canEdit}
                                            title="Remove Penalty"
                                        >
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {punishedPlayers.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
                        No penalties recorded manually for GW {gameweek}.
                    </div>
                )}

            </div>
        </div>
    );
};

export default PenaltyManager;