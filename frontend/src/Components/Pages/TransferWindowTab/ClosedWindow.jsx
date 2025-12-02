import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Style from "../../../Styles/ClosedWindow.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";
import { useAuth } from "../../../Context/AuthContext";
import API_URL from "../../../config";
import TurnOrderModal from "./TurnOrderModal";
import { getAuthHeaders } from "../../../services/authHelper";

function ClosedWindow() {
    const { nextGameweek } = useGameweek();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [currentOrder, setCurrentOrder] = useState([]);
    const [opening, setOpening] = useState(false);

    const parseDateArray = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        return new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]);
    };

    const transferWindowOpens = nextGameweek?.transferOpenTime
        ? parseDateArray(nextGameweek.transferOpenTime)
        : new Date();

    const isAdmin = user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_SUPER_ADMIN');

    const onClickOpenWindow = () => {
        setShowConfirmModal(true);
    };

    const performOpenWindow = async () => {
        if (!nextGameweek) return;

        setOpening(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/open-transfer-window/${nextGameweek.id}`, {
                method: "POST",
                headers: getAuthHeaders()
            });

            if (res.ok) {
                setShowConfirmModal(false);
                window.location.reload();
            } else {
                const msg = await res.text();
                alert(`Failed to open window: ${msg}`);
                setShowConfirmModal(false);
            }
        } catch (err) {
            console.error(err);
            alert("Error opening window");
            setShowConfirmModal(false);
        } finally {
            setOpening(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!nextGameweek) return;

            try {
                const usersRes = await fetch(`${API_URL}/api/users`, {
                    headers: getAuthHeaders()
                });
                const usersData = await usersRes.json();
                setUsersList(usersData);

                const orderRes = await fetch(`${API_URL}/api/market/turn-order/${nextGameweek.id}`, {
                    headers: getAuthHeaders()
                });

                if (orderRes.ok) {
                    const orderIds = await orderRes.json();
                    if (orderIds && orderIds.length > 0) {
                        const mappedOrder = orderIds.map(id => {
                            const userObj = usersData.find(u => u.id === id);
                            return userObj ? userObj.name : `User ${id}`;
                        });
                        setCurrentOrder(mappedOrder);
                    } else {
                        setCurrentOrder([]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch draft info", err);
            }
        };

        fetchData();
    }, [nextGameweek, isModalOpen]);

    return (
        <div className={Style.closedWindow}>
            <h2 className={Style.title}>Transfer Window</h2>
            <p className={Style.message}>The transfer window is currently closed.</p>

            {nextGameweek && (
                <>
                    <p className={Style.message}>The window will open in:</p>
                    <span>{formatDateTime(transferWindowOpens)}</span>
                </>
            )}

            <div
                style={{
                    backgroundColor: '#1b1035',
                    padding: '25px',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '550px',
                    margin: '20px auto',
                }}
            >
                <div style={{ color: '#00e5ff', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '8px', fontSize: '1.1rem' }}>
                    Upcoming Draft Order (GW {nextGameweek?.id})
                </div>
                {currentOrder.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentOrder.slice(0, 7).map((name, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: '3px solid #10b981', color: 'white', fontSize: '0.95rem' }}>
                                    <span style={{ color: '#9ca3af', width: '24px' }}>{index + 1}.</span>
                                    <span style={{ fontWeight: '500' }}>{name}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentOrder.slice(7, 14).map((name, index) => (
                                <div key={index + 7} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: '3px solid #3b82f6', color: 'white', fontSize: '0.95rem' }}>
                                    <span style={{ color: '#9ca3af', width: '24px' }}>{index + 8}.</span>
                                    <span style={{ fontWeight: '500' }}>{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ color: '#9ca3af', textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem', padding: '12px' }}>
                        Draft order hasn't been set yet.
                    </div>
                )}
            </div>

            <button
                className={Style.scoutButton}
                onClick={() => navigate("/scout")}
            >
                Go to Scout and build your Watchlist
            </button>

            {isAdmin && (
                <div style={{ marginTop: '30px', width: '100%', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button
                        style={{
                            backgroundColor: 'transparent',
                            color: '#00e5ff',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: '1px solid #00e5ff',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                        }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Manage Draft Order
                    </button>

                    <button
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: opening ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            opacity: opening ? 0.7 : 1,
                            boxShadow: '0 2px 5px rgba(239, 68, 68, 0.3)'
                        }}
                        onClick={onClickOpenWindow}
                        disabled={opening}
                    >
                        {opening ? "Opening..." : "Open Window NOW"}
                    </button>
                </div>
            )}

            {isModalOpen && (
                <TurnOrderModal
                    onClose={() => setIsModalOpen(false)}
                    usersList={usersList}
                />
            )}

            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#1f2937',
                        padding: '25px',
                        borderRadius: '12px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        border: '1px solid #374151'
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '10px'
                        }}>
                        </div>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '1.5rem',
                            marginBottom: '10px',
                            fontWeight: '700'
                        }}>
                            Are you sure?
                        </h3>
                        <p style={{
                            color: '#9ca3af',
                            marginBottom: '25px',
                            lineHeight: '1.5'
                        }}>
                            You are about to open the <strong>Transfer Window</strong> immediately.
                            This action will allow all users to start making transfers.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #4b5563',
                                    backgroundColor: 'transparent',
                                    color: '#d1d5db',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={performOpenWindow}
                                disabled={opening}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    cursor: opening ? 'wait' : 'pointer',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                {opening ? "Opening..." : "Yes, Open it"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatDateTime(date) {
    if (!date) return "";

    const dateStr = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).replace(/,/g, '');

    const timeStr = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jerusalem",
    });

    return (
        <p>
            {dateStr} {timeStr}
        </p>
    );
}

export default ClosedWindow;