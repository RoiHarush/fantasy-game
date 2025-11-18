import React, { useState, useEffect } from 'react';
import API_URL from '../../../config';

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    },
    header: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem',
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        paddingRight: '10px',
    },
    footer: {
        marginTop: '1.5rem',
        borderTop: '1px solid #eee',
        paddingTop: '1rem',
        textAlign: 'right',
    },
    button: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginLeft: '10px',
        fontSize: '0.9rem',
    },
    buttonSecondary: {
        backgroundColor: '#6b7280',
        color: 'white',
    },
    inputGroup: {
        marginBottom: '1rem',
    },
    label: {
        display: 'block',
        fontWeight: 'bold',
        marginBottom: '4px',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        backgroundColor: 'white',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
    },
};

export default function AdminUserEditModal({ userId, onClose, onSave }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/admin/user-details/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch user details');
                const data = await res.json();
                setUserData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [userId]);

    const handleSave = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const payload = {
            ...userData,
            password: newPassword ? newPassword : null
        };
        try {
            const res = await fetch(`${API_URL}/api/admin/user-details/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            if (!res.ok) throw new Error('Failed to save user details');
            onSave();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handlePointsChange = (index, newPoints) => {
        const updatedPoints = [...userData.gameweekPoints];
        updatedPoints[index].points = parseInt(newPoints, 10) || 0;
        setUserData({ ...userData, gameweekPoints: updatedPoints });
    };

    const handleChipCountChange = (chipName, newCount) => {
        setUserData({
            ...userData,
            chips: { ...userData.chips, [chipName]: parseInt(newCount, 10) || 0 }
        });
    };

    const handleActiveChipChange = (chipName, isActive) => {
        setUserData({
            ...userData,
            activeChips: { ...userData.activeChips, [chipName]: isActive }
        });
    };

    if (loading && !userData) return <div>Loading Details...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!userData) return null;

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={modalStyles.header}>Edit User: {userData.username} (ID: {userData.userId})</h2>

                <div style={modalStyles.content}>
                    {loading && <div style={{ position: 'absolute', top: '50%', left: '50%' }}>Saving...</div>}

                    <div style={modalStyles.grid}>
                        <div style={modalStyles.inputGroup}>
                            <label style={modalStyles.label}>Username</label>
                            <input style={modalStyles.input} name="username" value={userData.username} onChange={handleChange} />
                        </div>
                        <div style={modalStyles.inputGroup}>
                            <label style={modalStyles.label}>Name</label>
                            <input style={modalStyles.input} name="name" value={userData.name} onChange={handleChange} />
                        </div>
                        <div style={modalStyles.inputGroup}>
                            <label style={modalStyles.label}>Role</label>
                            <select style={modalStyles.select} name="role" value={userData.role} onChange={handleChange}>
                                <option value="ROLE_USER">USER</option>
                                <option value="ROLE_ADMIN">ADMIN</option>
                                <option value="ROLE_SUPER_ADMIN">SUPER ADMIN</option>
                            </select>
                        </div>
                        <div style={modalStyles.inputGroup}>
                            <label style={modalStyles.label}>Fantasy Team Name</label>
                            <input style={modalStyles.input} name="fantasyTeamName" value={userData.fantasyTeamName} onChange={handleChange} />
                        </div>

                        <div style={modalStyles.inputGroup}>
                            <label style={{ ...modalStyles.label, color: '#b45309' }}>Reset Password</label>
                            <input
                                type="password"
                                style={{ ...modalStyles.input, border: '1px solid #b45309' }}
                                placeholder="Leave empty to keep current"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <hr style={{ margin: '1.5rem 0' }} />

                    <h3>Chips</h3>
                    <div style={modalStyles.grid}>
                        {Object.entries(userData.chips).map(([chipName, count]) => (
                            <div style={modalStyles.inputGroup} key={chipName}>
                                <label style={modalStyles.label}>{chipName} (Count)</label>
                                <input
                                    type="number"
                                    style={modalStyles.input}
                                    value={count}
                                    onChange={(e) => handleChipCountChange(chipName, e.target.value)}
                                />
                            </div>
                        ))}
                        {Object.entries(userData.activeChips).map(([chipName, isActive]) => (
                            <div style={modalStyles.inputGroup} key={chipName}>
                                <label style={modalStyles.label}>{chipName} (Active)</label>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => handleActiveChipChange(chipName, e.target.checked)}
                                />
                            </div>
                        ))}
                    </div>

                    <hr style={{ margin: '1.5rem 0' }} />

                    <h3>Gameweek Points</h3>
                    <div style={modalStyles.grid}>
                        {userData.gameweekPoints.sort((a, b) => a.gameweek - b.gameweek).map((gwPoint, index) => (
                            <div style={modalStyles.inputGroup} key={gwPoint.gameweek}>
                                <label style={modalStyles.label}>Gameweek {gwPoint.gameweek}</label>
                                <input
                                    type="number"
                                    style={modalStyles.input}
                                    value={gwPoint.points}
                                    onChange={(e) => handlePointsChange(index, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div style={modalStyles.footer}>
                    <button style={{ ...modalStyles.button, ...modalStyles.buttonSecondary }} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button style={modalStyles.button} onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div >
    );
}