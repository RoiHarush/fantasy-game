import React, { useState, useEffect } from 'react';
import { AdminService } from '../../../services/adminService';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../Context/PlayersContext';
import { useGameweek } from '../../../Context/GameweeksContext';

const normalize = (str) =>
    (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[øØöÖœŒ]/g, "o")
        .replace(/[åÅäÄáÁàÀâÂ]/g, "a")
        .replace(/[éÉèÈêÊëË]/g, "e")
        .replace(/[íÍìÌîÎïÏ]/g, "i")
        .replace(/[úÚùÙûÛüÜ]/g, "u")
        .replace(/[ñÑ]/g, "n")
        .replace(/[łŁ]/g, "l")
        .toLowerCase();

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
            const term = normalize(searchTerm);
            const results = players.filter(p => {
                const pName = normalize(p.viewName);
                const pFirst = normalize(p.firstName);
                const pLast = normalize(p.lastName);
                return pName.includes(term) || pFirst.includes(term) || pLast.includes(term);
            }).slice(0, 5);
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
            alert("Cannot edit assists: Gameweek is locked/not calculated yet.");
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
            setSearchTerm("");
            setSearchResults([]);
        } catch (error) {
            alert("Failed to update assist");
        }
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
                    style={styles.select}
                    value={gameweek || ''}
                    onChange={(e) => setGameweek(Number(e.target.value))}
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
                {loading ? <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div> : (
                    <>
                        {assisters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', backgroundColor: 'white', borderRadius: '16px' }}>
                                No assists recorded yet.
                            </div>
                        ) : (
                            assisters.map((item) => {
                                const realPlayer = players.find(p => p.id === item.playerId);
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
                                                onClick={() => handleUpdate(item.playerId, "REMOVE")}
                                                disabled={!canEdit}
                                                style={{ ...styles.roundBtn, backgroundColor: 'white', color: '#ef4444', opacity: canEdit ? 1 : 0.5 }}
                                            >-</button>

                                            <span style={{ fontSize: '1.2rem', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>
                                                {item.numOfAssist}
                                            </span>

                                            <button
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