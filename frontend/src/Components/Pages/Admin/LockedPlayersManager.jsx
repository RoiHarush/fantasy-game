import React, { useState, useEffect } from 'react';
import { AdminService } from '../../../services/adminService';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../Context/PlayersContext';

const LockedPlayersManager = () => {
    const { players, setPlayers } = usePlayers();

    const [serverLockedPlayers, setServerLockedPlayers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLockedPlayers();
    }, []);

    const loadLockedPlayers = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getLockedPlayers();
            setServerLockedPlayers(data);
        } catch (error) {
            console.error("Error loading locked players", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        const results = players.filter(p =>
            p.available === true && (
                p.viewName.toLowerCase().includes(term.toLowerCase()) ||
                (p.firstName && p.firstName.toLowerCase().includes(term.toLowerCase())) ||
                (p.lastName && p.lastName.toLowerCase().includes(term.toLowerCase()))
            )
        ).slice(0, 5);

        setSearchResults(results);
    };

    const handleToggleLock = async (player, shouldLock) => {
        try {
            const updatedPlayer = await AdminService.togglePlayerLock(player.id, shouldLock);

            await loadLockedPlayers();

            setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));

            if (shouldLock) {
                setSearchTerm("");
                setSearchResults([]);
            }
        } catch (error) {
            alert("Failed to change player lock status");
        }
    };

    const styles = {
        container: { padding: '0 2rem 2rem 2rem', fontFamily: 'sans-serif' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1000px', margin: '0 auto' },
        card: { backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', height: 'fit-content' },
        title: { fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '1rem', outline: 'none' },
        list: { marginTop: '1rem', maxHeight: '500px', overflowY: 'auto' },
        item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #f3f4f6' },
        playerInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
        btnLock: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#ef4444', color: 'white' },
        btnUnlock: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#10b981', color: 'white' },
        empty: { textAlign: 'center', color: '#9ca3af', padding: '2rem', fontStyle: 'italic' },
        kitWrapper: { width: '40px', display: 'flex', justifyContent: 'center' },
        kitStyle: { width: '35px', height: '35px', objectFit: 'contain' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.grid}>

                <div style={styles.card}>
                    <h2 style={styles.title}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Lock Free Agent
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>Search for an available player to lock.</p>

                    <input
                        type="text"
                        placeholder="Type player name..."
                        style={styles.input}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />

                    <div style={styles.list}>
                        {searchResults.map(p => (
                            <div key={p.id} style={styles.item}>
                                <div style={styles.playerInfo}>
                                    <div style={styles.kitWrapper}>
                                        <PlayerKit teamId={p.teamId} type="field" style={styles.kitStyle} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{p.viewName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.firstName} {p.lastName}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleToggleLock(p, true)} style={styles.btnLock}>
                                    Lock
                                </button>
                            </div>
                        ))}
                        {searchTerm.length > 1 && searchResults.length === 0 && (
                            <div style={styles.empty}>No available players found</div>
                        )}
                    </div>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.title}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                        Locked Players ({serverLockedPlayers.length})
                    </h2>

                    <div style={styles.list}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>Loading...</div>
                        ) : serverLockedPlayers.length === 0 ? (
                            <div style={styles.empty}>No players are currently locked.</div>
                        ) : (
                            serverLockedPlayers.map(p => (
                                <div key={p.id} style={styles.item}>
                                    <div style={styles.playerInfo}>
                                        <div style={styles.kitWrapper}>
                                            <PlayerKit teamId={p.teamId} type="field" style={styles.kitStyle} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{p.viewName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>LOCKED</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggleLock(p, false)} style={styles.btnUnlock}>
                                        Unlock
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LockedPlayersManager;