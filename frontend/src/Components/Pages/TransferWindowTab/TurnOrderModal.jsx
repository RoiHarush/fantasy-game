import React, { useState, useEffect } from 'react';
import API_URL from '../../../config';
import { useGameweek } from '../../../Context/GameweeksContext';
import { getAuthHeaders } from '../../../services/authHelper';

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    modal: {
        backgroundColor: '#1f2937',
        color: '#f3f4f6',
        padding: '2rem',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '600px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid #374151',
    },
    header: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        borderBottom: '1px solid #4b5563',
        paddingBottom: '1rem',
        textAlign: 'center',
        color: 'white',
    },
    scrollArea: {
        flex: 1,
        overflowY: 'auto',
        paddingRight: '10px',
        marginBottom: '1.5rem',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
        backgroundColor: '#374151',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #4b5563',
    },
    label: {
        width: '80px',
        fontWeight: 'bold',
        color: '#9ca3af',
    },
    select: {
        flex: 1,
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #6b7280',
        backgroundColor: '#111827',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        borderTop: '1px solid #4b5563',
        paddingTop: '1rem',
    },
    button: {
        padding: '10px 24px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        transition: 'background 0.2s',
    },
    saveBtn: {
        backgroundColor: '#10b981',
        color: 'white',
    },
    cancelBtn: {
        backgroundColor: '#ef4444',
        color: 'white',
    }
};

export default function TurnOrderModal({ onClose, usersList }) {
    const { nextGameweek } = useGameweek();

    const [picks, setPicks] = useState(Array(14).fill(""));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentOrder = async () => {
            if (!nextGameweek) return;

            try {
                const res = await fetch(`${API_URL}/api/league-admin/manual-turn/${nextGameweek.id}`, {
                    headers: getAuthHeaders()
                });

                if (res.ok) {
                    const existingOrder = await res.json();
                    if (existingOrder && existingOrder.length > 0) {
                        const newPicks = Array(14).fill("").map((_, i) =>
                            i < existingOrder.length ? String(existingOrder[i]) : ""
                        );
                        setPicks(newPicks);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch existing order", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentOrder();
    }, [nextGameweek]);

    const handleUserSelect = (index, userId) => {
        const newPicks = [...picks];
        newPicks[index] = userId;
        setPicks(newPicks);
    };

    const handleSave = async () => {
        const cleanOrder = picks.filter(id => id !== "").map(Number);

        if (cleanOrder.length === 0) {
            if (!window.confirm("You are saving an empty list. This will clear the draft order. Continue?")) return;
        }

        const dto = { order: cleanOrder };

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/league-admin/manual-turn/${nextGameweek.id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(dto)
            });

            if (!res.ok) throw new Error(await res.text());

            alert("Draft order updated successfully!");
            onClose();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    Set Draft Order (GW {nextGameweek?.id})
                </div>

                <div style={styles.scrollArea}>
                    {picks.map((selectedUserId, index) => (
                        <div key={index} style={styles.row}>
                            <div style={styles.label}>Pick #{index + 1}</div>
                            <select
                                style={styles.select}
                                value={selectedUserId}
                                onChange={(e) => handleUserSelect(index, e.target.value)}
                            >
                                <option value="">-- Select User --</option>
                                {usersList.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.fantasyTeam ? `(${u.fantasyTeam})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div style={styles.actions}>
                    <button
                        style={{ ...styles.button, ...styles.cancelBtn }}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        style={{ ...styles.button, ...styles.saveBtn }}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}