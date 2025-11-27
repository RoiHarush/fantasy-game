import React, { useState, useEffect, useCallback } from 'react';
import API_URL from '../../../config';
import { useAuth } from '../../../Context/AuthContext';
import AdminUserEditModal from './AdminUserEditModal';
import { getAuthHeaders } from '../../../services/authHelper';

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    th: {
        backgroundColor: '#f3f4f6',
        padding: '12px 16px',
        textAlign: 'left',
        borderBottom: '2px solid #e5e7eb',
        fontWeight: 'bold',
    },
    td: {
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
    },
    editButton: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
    }
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/admin/users-summary`, {
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                throw new Error('Failed to fetch users. Are you an admin?');
            }

            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCloseModal = () => {
        setEditingUser(null);
    };

    const handleSaveAndClose = () => {
        setEditingUser(null);
        fetchUsers();
    };

    if (loading) return <div>Loading Users...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                Users Management
            </h1>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>User ID</th>
                        <th style={styles.th}>Username</th>
                        <th style={styles.th}>Role</th>
                        <th style={styles.th}>Fantasy Team</th>
                        <th style={styles.th}>Total Points</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.userId}>
                            <td style={styles.td}>{u.userId}</td>
                            <td style={styles.td}>{u.username}</td>
                            <td style={styles.td}>{u.role}</td>
                            <td style={styles.td}>{u.fantasyTeamName}</td>
                            <td style={styles.td}>{u.totalPoints}</td>
                            <td style={styles.td}>
                                <button
                                    style={styles.editButton}
                                    onClick={() => setEditingUser(u.userId)}
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingUser && (
                <AdminUserEditModal
                    userId={editingUser}
                    onClose={handleCloseModal}
                    onSave={handleSaveAndClose}
                />
            )}
        </div>
    );
}