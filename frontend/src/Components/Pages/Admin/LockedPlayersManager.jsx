import { useMemo, useState } from "react";
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../features/players/usePlayers';
import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useLockedPlayers } from "../../../features/league-admin/useLeagueAdmin";

const LockedPlayersManager = ({ maintenanceLeagueId = null }) => {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const [searchTerm, setSearchTerm] = useState("");
    const { query: lockedQuery, mutation: toggleLock } = useLockedPlayers(maintenanceLeagueId);
    const serverLockedPlayers = lockedQuery.data ?? [];
    const searchResults = useMemo(() => {
        return findPlayers(players, searchTerm, { availableOnly: true });
    }, [players, searchTerm]);

    const handleToggleLock = (player, shouldLock) => {
        toggleLock.mutate(
            { player, shouldLock },
            { onSuccess: () => shouldLock && setSearchTerm("") },
        );
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
                    aria-label="Find player to lock"
                    placeholder="Find player to lock..."
                    style={styles.input}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {(playersQuery.error || lockedQuery.error || toggleLock.error) && (
                    <p role="alert">
                        {playersQuery.error?.message || lockedQuery.error?.message || toggleLock.error?.message || "Player lock could not be updated."}
                    </p>
                )}
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
                            <button
                                type="button"
                                onClick={() => handleToggleLock(p, true)}
                                style={styles.lockBtn}
                                disabled={toggleLock.isPending}
                            >Lock</button>
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
                    {lockedQuery.isPending ? <div>Loading...</div> : serverLockedPlayers.length === 0 ? (
                        <div style={{ color: '#991b1b', opacity: 0.7, fontStyle: 'italic', textAlign: 'center' }}>No locked players</div>
                    ) : (
                        serverLockedPlayers.map(p => {
                            const realPlayer = players.find((player) => String(player.id) === String(p.id));
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
                                    <button
                                        type="button"
                                        onClick={() => handleToggleLock(p, false)}
                                        style={styles.unlockBtn}
                                        disabled={toggleLock.isPending}
                                    >Unlock</button>
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
