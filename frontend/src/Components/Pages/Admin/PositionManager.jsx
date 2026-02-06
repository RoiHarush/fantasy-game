import React, { useState } from 'react';
import { AdminService } from '../../../services/adminService';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../Context/PlayersContext';

const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const PositionManager = () => {
    const { players, setPlayers } = usePlayers();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);

    const positions = [
        { id: 1, code: 'GK', label: 'Goalkeeper' },
        { id: 2, code: 'DEF', label: 'Defender' },
        { id: 3, code: 'MID', label: 'Midfielder' },
        { id: 4, code: 'FWD', label: 'Forward' }
    ];

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.length < 2) { setSearchResults([]); return; }
        const normTerm = normalize(term);

        const results = players.filter(p => {
            if (!p.available) return false;

            return normalize(p.viewName).includes(normTerm) ||
                normalize(p.firstName).includes(normTerm) ||
                normalize(p.lastName).includes(normTerm);
        }).slice(0, 5);

        setSearchResults(results);
    };

    const handleChangePosition = async (player, posId) => {
        setUpdatingId(player.id);
        try {
            await AdminService.updatePlayerPosition(player.id, posId);

            const newPosCode = positions.find(p => p.id === posId).code;
            setPlayers(prev => prev.map(p =>
                p.id === player.id ? { ...p, position: newPosCode } : p
            ));

            setSearchResults(prev => prev.map(p =>
                p.id === player.id ? { ...p, position: newPosCode } : p
            ));
        } catch (error) {
            alert("Update failed");
        } finally {
            setUpdatingId(null);
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        card: { backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
        input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fafb', marginBottom: '1rem' },
        listItem: { display: 'flex', flexDirection: 'column', padding: '15px 0', borderBottom: '1px solid #f3f4f6', gap: '10px' },
        posGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
        posBtn: (isActive) => ({
            padding: '8px 4px', borderRadius: '6px', border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            backgroundColor: isActive ? '#eff6ff' : 'white', color: isActive ? '#1d4ed8' : '#6b7280',
            fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
        })
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Change Player Position
                </h3>
                <input
                    type="text"
                    placeholder="Search free agents..."
                    style={styles.input}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                />

                <div>
                    {searchResults.map(p => (
                        <div key={p.id} style={styles.listItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <PlayerKit teamId={p.teamId} type={p.position === "GK" ? "gk" : "field"} style={{ width: '35px', height: '35px' }} />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{p.viewName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Current: {p.position}</div>
                                </div>
                            </div>

                            <div style={styles.posGrid}>
                                {positions.map(pos => (
                                    <button
                                        key={pos.id}
                                        disabled={updatingId === p.id}
                                        onClick={() => handleChangePosition(p, pos.id)}
                                        style={styles.posBtn(p.position === pos.code)}
                                    >
                                        {pos.code}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PositionManager;