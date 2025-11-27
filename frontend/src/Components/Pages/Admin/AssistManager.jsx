import React, { useState, useEffect } from 'react';
import { AdminService } from '../../../services/adminService';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../Context/PlayersContext';
import { useGameweek } from '../../../Context/GameweeksContext';

const AssistManager = () => {
    const { players } = usePlayers();
    const { currentGameweek } = useGameweek();

    const [gameweek, setGameweek] = useState();
    const [assisters, setAssisters] = useState([]);
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
        loadAssisters();
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

    const loadAssisters = async () => {
        if (!gameweek) return;

        setLoading(true);
        try {
            const data = await AdminService.getAssisters(gameweek);
            setAssisters(data);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (playerId, action) => {
        if (!canEdit) {
            alert("Cannot edit assists for uncalculated gameweek!");
            return;
        }

        try {
            const updatedPlayer = await AdminService.updateAssist(playerId, gameweek, action);

            setAssisters(prev => {
                const exists = prev.find(p => p.playerId === updatedPlayer.playerId);
                if (exists) {
                    if (updatedPlayer.numOfAssist === 0) {
                        return prev.filter(p => p.playerId !== updatedPlayer.playerId);
                    }
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
            alert("Failed to update assist");
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb'
        },
        title: { fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: 0 },
        subtitle: { fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' },
        selectWrapper: { position: 'relative', display: 'inline-block' },
        select: {
            appearance: 'none', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', color: '#111827',
            padding: '0.6rem 2.5rem 0.6rem 2.5rem',
            fontSize: '0.875rem', borderRadius: '0.5rem',
            cursor: 'pointer', fontWeight: '500', outline: 'none'
        },
        listCard: {
            backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb', overflow: 'hidden'
        },
        row: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem', borderBottom: '1px solid #f3f4f6'
        },
        playerInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
        kitImage: {
            width: '50px', height: '50px', objectFit: 'contain',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
        },
        playerName: { fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0, lineHeight: 1.2 },
        controls: {
            display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '9999px', padding: '4px', gap: '4px'
        },
        btn: {
            width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s'
        },
        count: { width: '40px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' },
        emptyState: { padding: '3rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '2px dashed #e5e7eb', color: '#6b7280' },

        searchContainer: { marginBottom: '1.5rem', position: 'relative' },
        searchInput: {
            width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #e5e7eb',
            fontSize: '1rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white',
            opacity: canEdit ? 1 : 0.6,
            cursor: canEdit ? 'text' : 'not-allowed'
        },
        searchIcon: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' },
        dropdown: {
            position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', zIndex: 50, overflow: 'hidden'
        },
        dropdownItem: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem',
            borderBottom: '1px solid #f3f4f6', cursor: 'default'
        },
        addBtn: {
            backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '6px',
            fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
        }
    };

    const maxGameweekToShow = currentGameweek ? currentGameweek.id : 1;

    const disabledBtnStyle = { opacity: 0.3, cursor: 'not-allowed' };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>

                <div style={styles.headerCard}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={styles.title}>Assist Control</h2>
                            {!canEdit && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    border: '1px solid #fecaca',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    Locked
                                    <img src="/Icons/lock.svg" alt="locked" style={{ width: '10px', height: '10px' }} />
                                </span>
                            )}
                        </div>
                        <p style={styles.subtitle}>GW {gameweek} Updates</p>
                    </div>

                    <div style={styles.selectWrapper}>
                        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>

                        <select
                            value={gameweek}
                            onChange={(e) => setGameweek(Number(e.target.value))}
                            style={styles.select}
                        >
                            {[...Array(maxGameweekToShow)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Gameweek {i + 1}</option>
                            ))}
                        </select>

                        <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>

                <div style={styles.searchContainer}>
                    <svg style={styles.searchIcon} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={canEdit ? "Search player to add assist..." : "Gameweek is locked for editing..."}
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!canEdit}
                    />

                    {searchResults.length > 0 && (
                        <div style={styles.dropdown}>
                            {searchResults.map(player => (
                                <div key={player.id} style={styles.dropdownItem}>
                                    <div style={styles.playerInfo}>
                                        <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                                            <PlayerKit
                                                teamId={player.teamId}
                                                type="field"
                                                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#374151' }}>{player.viewName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {player.firstName} {player.lastName}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUpdate(player.id, "ADD")}
                                        style={{ ...styles.addBtn, ...(!canEdit ? disabledBtnStyle : {}) }}
                                        disabled={!canEdit}
                                    >
                                        Add Assist
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        Loading...
                    </div>
                ) : (
                    <div>
                        {assisters.length === 0 ? (
                            <div style={styles.emptyState}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>No assists yet</h3>
                                <p>The creative sparks haven't flown in GW {gameweek} yet.</p>
                            </div>
                        ) : (
                            <div style={styles.listCard}>
                                {assisters.map((item) => (
                                    <div key={item.playerId} style={styles.row}>

                                        <div style={styles.playerInfo}>
                                            <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
                                                <PlayerKit
                                                    teamId={item.teamId}
                                                    type="field"
                                                    style={styles.kitImage}
                                                />
                                            </div>
                                            <div>
                                                <h3 style={styles.playerName}>{item.viewName}</h3>
                                            </div>
                                        </div>

                                        <div style={styles.controls}>
                                            <button
                                                onClick={() => handleUpdate(item.playerId, "REMOVE")}
                                                style={{ ...styles.btn, color: '#ef4444', ...(!canEdit ? disabledBtnStyle : {}) }}
                                                disabled={!canEdit}
                                                title="Remove Assist"
                                            >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path>
                                                </svg>
                                            </button>

                                            <div style={styles.count}>
                                                {item.numOfAssist}
                                            </div>

                                            <button
                                                onClick={() => handleUpdate(item.playerId, "ADD")}
                                                style={{ ...styles.btn, color: '#7c3aed', ...(!canEdit ? disabledBtnStyle : {}) }}
                                                disabled={!canEdit}
                                                title="Add Assist"
                                            >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path>
                                                </svg>
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssistManager;