import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Style from "../../../Styles/ClosedWindow.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";
import { useAuth } from "../../../Context/AuthContext";
import API_URL from "../../../config";
import TurnOrderModal from "./TurnOrderModal";

function ClosedWindow() {
    const { nextGameweek } = useGameweek();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [currentOrder, setCurrentOrder] = useState([]);

    const parseDateArray = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        return new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]);
    };

    const transferWindowOpens = nextGameweek?.transferOpenTime
        ? parseDateArray(nextGameweek.transferOpenTime)
        : new Date();

    const isAdmin = user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_SUPER_ADMIN');

    useEffect(() => {
        const fetchData = async () => {
            if (!nextGameweek) return;
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const usersRes = await fetch(`${API_URL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usersData = await usersRes.json();
                setUsersList(usersData);

                const orderRes = await fetch(`${API_URL}/api/league-admin/manual-turn/${nextGameweek.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
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
                <div
                    style={{
                        color: '#00e5ff',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.12)',
                        paddingBottom: '8px',
                        fontSize: '1.1rem'
                    }}
                >
                    Upcoming Draft Order (GW {nextGameweek?.id})
                </div>

                {currentOrder.length > 0 ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginTop: '10px'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentOrder.slice(0, 7).map((name, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '6px',
                                        borderLeft: '3px solid #10b981',
                                        color: 'white',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    <span style={{ color: '#9ca3af', width: '24px' }}>
                                        {index + 1}.
                                    </span>
                                    <span style={{ fontWeight: '500' }}>{name}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentOrder.slice(7, 14).map((name, index) => (
                                <div
                                    key={index + 7}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '6px',
                                        borderLeft: '3px solid #3b82f6',
                                        color: 'white',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    <span style={{ color: '#9ca3af', width: '24px' }}>
                                        {index + 8}.
                                    </span>
                                    <span style={{ fontWeight: '500' }}>{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            color: '#9ca3af',
                            textAlign: 'center',
                            fontStyle: 'italic',
                            fontSize: '0.9rem',
                            padding: '12px'
                        }}
                    >
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
                <div style={{ marginTop: '30px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <button
                        style={{
                            backgroundColor: '#00e5ff',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: '1px solid #00e5ff',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            opacity: 0.9
                        }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Manage Draft Order
                    </button>
                </div>
            )}

            {isModalOpen && (
                <TurnOrderModal
                    onClose={() => setIsModalOpen(false)}
                    usersList={usersList}
                />
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