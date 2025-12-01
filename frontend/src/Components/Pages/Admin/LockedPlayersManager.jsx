import React, { useState, useEffect } from 'react';
import { AdminService } from '../../../services/adminService';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../Context/PlayersContext';

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

const LockedPlayersManager = () => {
    const { players, setPlayers } = usePlayers();
    const [serverLockedPlayers, setServerLockedPlayers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadLockedPlayers(); }, []);

    const loadLockedPlayers = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getLockedPlayers();
            setServerLockedPlayers(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.length < 2) { setSearchResults([]); return; }

        const normTerm = normalize(term);

        const results = players.filter(p => {
            if (!p.available) return false;

            const pName = normalize(p.viewName);
            const pFirst = normalize(p.firstName);
            const pLast = normalize(p.lastName);

            return pName.includes(normTerm) || pFirst.includes(normTerm) || pLast.includes(normTerm);
        }).slice(0, 5);

        setSearchResults(results);
    };

    const handleToggleLock = async (player, shouldLock) => {
        try {
            const updatedPlayer = await AdminService.togglePlayerLock(player.id, shouldLock);
            await loadLockedPlayers();
            setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
            if (shouldLock) { setSearchTerm(""); setSearchResults([]); }
        } catch (error) { alert("Failed"); }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        sectionTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' },

        searchCard: {
            backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6'
        },
        input: {
            width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb',
            fontSize: '1rem', outline: 'none', backgroundColor: '#f9fafb'
        },

        listWrapper: { marginTop: '1rem' },
        listItem: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: '1px solid #f3f4f6'
        },

        lockedCard: {
            backgroundColor: '#fff1f2', borderRadius: '16px', padding: '1.5rem',
            border: '1px solid #fecaca'
        },

        lockBtn: { backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
        unlockBtn: { backgroundColor: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }
    };

    return (
        <div style={styles.container}>

            <div style={styles.searchCard}>
                <div style={styles.sectionTitle}>
                    <svg width="20" height="20" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Lock Free Agent
                </div>
                <input
                    type="text"
                    placeholder="Find player to lock..."
                    style={styles.input}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                <div style={styles.listWrapper}>
                    {searchResults.map(p => (
                        <div key={p.id} style={styles.listItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <PlayerKit teamId={p.teamId} type={p.position === "GK" ? "gk" : "field"} style={{ width: '40px', height: '40px' }} />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{p.viewName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.position}</div>
                                </div>
                            </div>
                            <button onClick={() => handleToggleLock(p, true)} style={styles.lockBtn}>Lock</button>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.lockedCard}>
                <div style={{ ...styles.sectionTitle, color: '#991b1b', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                        Locked Players
                    </div>
                    <span style={{ backgroundColor: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{serverLockedPlayers.length}</span>
                </div>

                <div style={styles.listWrapper}>
                    {loading ? <div>Loading...</div> : serverLockedPlayers.length === 0 ? (
                        <div style={{ color: '#991b1b', opacity: 0.7, fontStyle: 'italic', textAlign: 'center' }}>No locked players</div>
                    ) : (
                        serverLockedPlayers.map(p => {
                            const realPlayer = players.find(pl => pl.id === p.id);
                            const position = realPlayer ? realPlayer.position : (p.position || "MID");

                            return (
                                <div key={p.id} style={{ ...styles.listItem, borderBottom: '1px solid #fecaca' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <PlayerKit
                                            teamId={p.teamId}
                                            type={position === "GK" ? "gk" : "field"}
                                            style={{ width: '40px', height: '40px' }}
                                        />
                                        <div style={{ fontWeight: 'bold', color: '#7f1d1d' }}>{p.viewName}</div>
                                    </div>
                                    <button onClick={() => handleToggleLock(p, false)} style={styles.unlockBtn}>Unlock</button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default LockedPlayersManager;