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
            alert("Cannot edit penalties: Gameweek is locked/not calculated yet.");
            return;
        }
        try {
            const updatedPlayer = await AdminService.updatePenaltyConceded(playerId, gameweek, action);
            setPunishedPlayers(prev => {
                if (updatedPlayer.penaltiesConceded === 0) {
                    return prev.filter(p => p.playerId !== updatedPlayer.playerId);
                }
                const exists = prev.find(p => p.playerId === updatedPlayer.playerId);
                return exists ? prev.map(p => p.playerId === updatedPlayer.playerId ? updatedPlayer : p) : [...prev, updatedPlayer];
            });
            setSearchTerm("");
            setSearchResults([]);
        } catch (error) {
            alert("Failed to update penalty");
        }
    };

    const styles = {
        headerCard: {
            backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', borderLeft: '5px solid #ef4444', textAlign: 'center', position: 'relative'
        },
        lockedBadge: {
            display: 'inline-block', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: 'bold',
            padding: '4px 12px', borderRadius: '20px', marginBottom: '8px', border: '1px solid #fecaca'
        },
        select: {
            marginTop: '10px', width: '100%', padding: '12px', borderRadius: '10px',
            border: '1px solid #e5e7eb', fontSize: '1rem', backgroundColor: '#fff5f5'
        },
        searchContainer: { marginBottom: '1.5rem', position: 'relative' },
        searchInput: {
            width: '100%', padding: '14px 16px 14px 45px', borderRadius: '12px', border: 'none',
            fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', outline: 'none',
        },
        card: {
            backgroundColor: 'white', borderRadius: '16px', padding: '1rem', marginBottom: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #fee2e2'
        },
        roundBtn: {
            width: '32px', height: '32px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        dropdown: { position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50 },
        dropdownItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' },
        addBtn: { backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }
    };

    return (
        <div>
            <div style={styles.headerCard}>
                {!canEdit && <div style={styles.lockedBadge}>🔒 LOCKED</div>}

                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#991b1b' }}>Penalty Conceded</h2>
                <div style={{ color: '#b91c1c', fontSize: '0.9rem', marginTop: '4px' }}>
                    Record penalties for Gameweek {gameweek}
                </div>
                <select style={styles.select} value={gameweek || ''} onChange={(e) => setGameweek(Number(e.target.value))}>
                    {[...Array(currentGameweek ? currentGameweek.id : 1)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Gameweek {i + 1}</option>
                    ))}
                </select>
            </div>

            <div style={styles.searchContainer}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder={canEdit ? "Search player to punish..." : "Gameweek is locked"}
                    style={{ ...styles.searchInput, opacity: canEdit ? 1 : 0.6, cursor: canEdit ? 'text' : 'not-allowed' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!canEdit}
                />
                {searchResults.length > 0 && (
                    <div style={styles.dropdown}>
                        {searchResults.map(player => (
                            <div key={player.id} style={styles.dropdownItem}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} style={{ width: '35px', height: '35px' }} />
                                    <span style={{ fontWeight: '600' }}>{player.viewName}</span>
                                </div>
                                <button
                                    onClick={() => handlePunish(player.id, "ADD")}
                                    style={{ ...styles.addBtn, opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                    disabled={!canEdit}
                                >
                                    Concede
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                {punishedPlayers.map((item) => {
                    const realPlayer = players.find(p => p.id === item.playerId);
                    const position = realPlayer ? realPlayer.position : "MID";

                    return (
                        <div key={item.playerId} style={styles.card}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <PlayerKit
                                    teamId={item.teamId}
                                    type={position === "GK" ? "gk" : "field"}
                                    style={{ width: '45px', height: '45px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{item.viewName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>
                                        {item.penaltiesConceded} Penalty ({item.penaltiesConceded * -2} pts)
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handlePunish(item.playerId, "REMOVE")}
                                    disabled={!canEdit}
                                    style={{ ...styles.roundBtn, backgroundColor: 'white', color: '#ef4444', border: '1px solid #fecaca', opacity: canEdit ? 1 : 0.5 }}
                                >-</button>
                                <button
                                    onClick={() => handlePunish(item.playerId, "ADD")}
                                    disabled={!canEdit}
                                    style={{ ...styles.roundBtn, backgroundColor: '#ef4444', color: 'white', opacity: canEdit ? 1 : 0.5 }}
                                >+</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PenaltyManager;