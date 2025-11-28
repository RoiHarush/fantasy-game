import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Context/AuthContext';
import { updateUserSettings } from '../../../services/SettingsService';

function SettingsPage() {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        teamName: '',
        currentPassword: '',
        newPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                username: user.username || '',
                teamName: user.fantasyTeamName || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const token = localStorage.getItem('token');

        const payload = {};
        if (formData.name !== user.name) payload.name = formData.name;
        if (formData.username !== user.username) payload.username = formData.username;
        if (formData.teamName !== user.fantasyTeamName) payload.teamName = formData.teamName;

        if (formData.newPassword) {
            payload.currentPassword = formData.currentPassword;
            payload.newPassword = formData.newPassword;
        }

        if (Object.keys(payload).length === 0) {
            setLoading(false);
            setMessage({ type: 'info', text: 'No changes detected.' });
            return;
        }

        try {
            const updatedUser = await updateUserSettings(payload);

            login(updatedUser, token);

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: "'Inter', sans-serif",
            color: '#333',
            backgroundColor: '#fff',
            minHeight: '100vh'
        },
        header: {
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '30px',
            color: '#1a1a1a',
            borderBottom: '1px solid #eee',
            paddingBottom: '20px'
        },
        section: {
            marginBottom: '40px'
        },
        sectionTitle: {
            fontSize: '1.2rem',
            fontWeight: '700',
            marginBottom: '15px',
            color: '#1f2937'
        },
        formGroup: {
            marginBottom: '20px'
        },
        label: {
            display: 'block',
            fontWeight: '600',
            marginBottom: '8px',
            fontSize: '0.9rem',
            color: '#374151'
        },
        input: {
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            outline: 'none',
            backgroundColor: '#fff',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box'
        },
        button: {
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '10px',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s'
        },
        message: {
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: '500',
            textAlign: 'center'
        },
        success: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
        error: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
        info: { backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Edit Your Profile</h1>

            {message.text && (
                <div style={{ ...styles.message, ...styles[message.type] }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Team Details</h2>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Team Name</label>
                        <input
                            type="text"
                            name="teamName"
                            value={formData.teamName}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter your team name"
                        />
                    </div>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Personal Info</h2>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name (Display Name)</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Username (Login)</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="e.g. john123"
                        />
                    </div>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Change Password</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                style={styles.input}
                                placeholder="New password"
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                style={styles.input}
                                placeholder="Required to save changes"
                                disabled={!formData.newPassword && formData.name === user?.name && formData.username === user?.username && formData.teamName === user?.fantasyTeamName}
                            />
                        </div>
                    </div>
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? 'Updating...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}

export default SettingsPage;