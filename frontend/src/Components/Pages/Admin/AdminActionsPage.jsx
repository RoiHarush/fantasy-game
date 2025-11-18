import React, { useState, useEffect, useMemo } from 'react';
import API_URL from '../../../config';
import { useAuth } from '../../../Context/AuthContext';

const styles = {
    section: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    h3: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        borderBottom: '2px solid #eee',
        paddingBottom: '8px',
        marginBottom: '16px',
    },
    h4: {
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    button: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '10px',
        marginTop: '10px',
        fontSize: '0.9rem',
    },
    buttonDestructive: {
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '10px',
        marginTop: '10px',
        fontSize: '0.9rem',
    },
    input: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        marginRight: '10px',
        minWidth: '120px',
        height: '40px',
    },
    select: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        marginRight: '10px',
        minWidth: '120px',
        height: '40px',
        backgroundColor: 'white',
    },
    textarea: {
        width: '100%',
        minHeight: '280px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        marginTop: '10px',
        boxSizing: 'border-box',
    },
    playerFinderInput: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxSizing: 'border-box',
        marginBottom: '8px',
    },
    playerList: {
        maxHeight: '150px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '8px',
        background: '#f9fafb',
    },
    playerListItem: {
        padding: '4px 8px',
        borderBottom: '1px solid #eee',
    },
    message: {
        marginTop: '16px',
        padding: '10px',
        borderRadius: '6px',
        wordBreak: 'break-word',
    },
    success: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
};

const DEFAULT_SQUAD_DTO = {
    startingLineup: {
        GK: [],
        DEF: [],
        MID: [],
        FWD: []
    },
    bench: {
        GK: 0,
        S1: 0,
        S2: 0,
        S3: 0
    },
    formation: {
        GK: 0,
        DEF: 0,
        MID: 0,
        FWD: 0
    },
    captainId: 0,
    viceCaptainId: 0,
    irId: null,
    firstPickId: 0
};

export default function AdminActionsPage() {
    const [gwInput, setGwInput] = useState('');
    const [squadUserId, setSquadUserId] = useState('');
    const [squadGw, setSquadGw] = useState('');
    const [squadDto, setSquadDto] = useState(JSON.stringify(DEFAULT_SQUAD_DTO, null, 2));

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [allPlayers, setAllPlayers] = useState([]);
    const [playerSearch, setPlayerSearch] = useState('');

    const [allUsersList, setAllUsersList] = useState([]);

    const { user } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('token');

        const fetchPlayers = async () => {
            try {
                const res = await fetch(`${API_URL}/api/players`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllPlayers(data.map(p => ({ id: p.id, viewName: p.viewName })));
                } else {
                    console.error("Failed to fetch players list");
                }
            } catch (err) {
                console.error("Error fetching players list:", err);
            }
        };

        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users-summary`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllUsersList(data.map(u => ({ userId: u.userId, username: u.username })));
                } else {
                    console.error("Failed to fetch users list");
                }
            } catch (err) {
                console.error("Error fetching users list:", err);
            }
        };

        fetchPlayers();
        fetchUsers();
    }, []);

    const filteredPlayers = useMemo(() => {
        if (!playerSearch) {
            return [];
        }
        return allPlayers.filter(p =>
            p.viewName.toLowerCase().includes(playerSearch.toLowerCase())
        );
    }, [allPlayers, playerSearch]);

    const callAdminApi = async (endpoint, method = 'POST', body = null) => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: body ? JSON.stringify(body) : null,
            });

            const responseText = await res.text();

            if (!res.ok) {
                throw new Error(responseText || 'Failed to perform action');
            }

            setMessage({ text: responseText || 'Success!', type: 'success' });

        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGameweek = () => {
        if (!gwInput || isNaN(gwInput)) return alert('Please enter a valid Gameweek ID');
        if (!window.confirm(`Are you sure you want to OPEN Gameweek ${gwInput}?`)) return;
        callAdminApi(`/api/admin/open/${gwInput}`);
    };
    const handleProcessGameweek = () => {
        if (!gwInput || isNaN(gwInput)) return alert('Please enter a valid Gameweek ID');
        if (!window.confirm(`Are you sure you want to PROCESS points for Gameweek ${gwInput}?`)) return;
        callAdminApi(`/api/admin/process-gameweek/${gwInput}`);
    };
    const handleUpdatePlayerPoints = () => {
        if (!gwInput || isNaN(gwInput)) return alert('Please enter a valid Gameweek ID');
        if (!window.confirm(`Are you sure you want to UPDATE player points for Gameweek ${gwInput}?`)) return;
        callAdminApi(`/api/admin/players/update-points?gw=${gwInput}`);
    };
    const handleOpenTransferWindow = () => {
        if (!gwInput || isNaN(gwInput)) return alert('Please enter a valid Gameweek ID');
        if (!window.confirm(`Are you sure you want to OPEN transfer window for Gameweek ${gwInput}?`)) return;
        callAdminApi(`/api/admin/open-transfer-window/${gwInput}`);
    };
    const handleCloseTransferWindow = () => {
        if (!window.confirm(`Are you sure you want to CLOSE the current transfer window?`)) return;
        callAdminApi(`/api/admin/close-transfer-window`);
    };
    const handleUpdateGameweeks = () => {
        if (!window.confirm(`Are you sure you want to update all gameweeks from API?`)) return;
        callAdminApi(`/api/admin/update-gameweeks`);
    };
    const handleRefreshPlayers = () => {
        if (!window.confirm(`Are you sure you want to refresh basic player data from API?`)) return;
        callAdminApi(`/api/admin/refresh-players`);
    };
    const handleSyncCurrent = () => {
        if (!window.confirm(`Are you sure you want to SYNC CURRENT GW?`)) return;
        callAdminApi(`/api/admin/sync-current`);
    };
    const handleSyncForGw = () => {
        if (!gwInput || isNaN(gwInput)) return alert('Please enter a valid Gameweek ID');
        if (!window.confirm(`Are you sure you want to SYNC Gameweek ${gwInput}?`)) return;
        callAdminApi(`/api/admin/sync/?gw=${gwInput}`);
    };
    const handleSaveSquad = () => {
        if (!squadUserId || !squadGw) return alert('Please enter User ID and Gameweek');
        let dto;
        try {
            dto = JSON.parse(squadDto);
        } catch (e) {
            return alert('Invalid JSON in Squad DTO field');
        }
        if (!window.confirm(`Are you sure you want to MANUALLY OVERWRITE squad for user ${squadUserId} in GW ${squadGw}?`)) return;
        callAdminApi(`/api/admin/user/${squadUserId}/squad/${squadGw}`, 'POST', dto);
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                System Actions
            </h1>

            <div style={styles.section}>
                <h3 style={styles.h3}>Gameweek & Points Management</h3>
                <div>
                    <input
                        type="number"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID"
                        style={styles.input}
                        disabled={loading}
                    />
                    <button style={styles.button} onClick={handleOpenGameweek} disabled={loading}>
                        Open Gameweek
                    </button>
                    <button style={styles.buttonDestructive} onClick={handleProcessGameweek} disabled={loading}>
                        Process Gameweek Points
                    </button>
                    <button style={styles.buttonDestructive} onClick={handleUpdatePlayerPoints} disabled={loading}>
                        Update Player Points for GW
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.h3}>Transfer Window Management</h3>
                <div>
                    <input
                        type="number"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID (for opening)"
                        style={styles.input}
                        disabled={loading}
                    />
                    <button style={styles.button} onClick={handleOpenTransferWindow} disabled={loading}>
                        Open Transfer Window
                    </button>
                    <button style={styles.buttonDestructive} onClick={handleCloseTransferWindow} disabled={loading}>
                        Close Transfer Window
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.h3}>Data Sync (API)</h3>
                <button style={styles.button} onClick={handleUpdateGameweeks} disabled={loading}>
                    Update All Gameweeks
                </button>
                <button style={styles.button} onClick={handleRefreshPlayers} disabled={loading}>
                    Refresh Player List
                </button>
                <button style={styles.button} onClick={handleSyncCurrent} disabled={loading}>
                    Full Sync Current GW
                </button>
                <div>
                    <input
                        type="number"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID"
                        style={{ ...styles.input, marginTop: '10px' }}
                        disabled={loading}
                    />
                    <button style={styles.button} onClick={handleSyncForGw} disabled={loading}>
                        Full Sync for Specific GW
                    </button>
                </div>
            </div>

            <div style={{ ...styles.section, backgroundColor: '#fffbeb' }}>
                <h3 style={{ ...styles.h3, color: '#b45309' }}>Manual Squad Override (Dangerous)</h3>

                <div style={{ marginBottom: '16px' }}>
                    <h4 style={styles.h4}>Player ID Finder</h4>
                    <input
                        type="text"
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        placeholder="Search player name..."
                        style={styles.playerFinderInput}
                    />
                    <div style={styles.playerList}>
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.map(p => (
                                <div key={p.id} style={styles.playerListItem}>
                                    <strong>{p.viewName}</strong> (ID: {p.id})
                                </div>
                            ))
                        ) : (
                            <span style={{ color: '#6b7280' }}>{playerSearch ? 'No players found' : 'name (ID: number)'}</span>
                        )}
                    </div>
                </div>

                <div>
                    <select
                        value={squadUserId}
                        onChange={(e) => setSquadUserId(e.target.value)}
                        style={styles.select}
                        disabled={loading}
                    >
                        <option value="">Select User</option>
                        {allUsersList.map(u => (
                            <option key={u.userId} value={u.userId}>
                                {u.username} (ID: {u.userId})
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={squadGw}
                        onChange={(e) => setSquadGw(e.target.value)}
                        placeholder="Gameweek ID"
                        style={styles.input}
                        disabled={loading}
                    />
                    <textarea
                        value={squadDto}
                        onChange={(e) => setSquadDto(e.target.value)}
                        placeholder="Paste SquadDto JSON here"
                        style={styles.textarea}
                        disabled={loading}
                    />
                    <button style={styles.buttonDestructive} onClick={handleSaveSquad} disabled={loading}>
                        Save Manual Squad
                    </button>
                </div>
            </div>

            {message.text && (
                <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
                    {message.text}
                </div>
            )}
        </div>
    );
}