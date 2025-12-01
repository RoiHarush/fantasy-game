import React, { useState } from 'react';
import AssistManager from './AssistManager';
import LockedPlayersManager from './LockedPlayersManager';
import PenaltyManager from './PenaltyManager';

const LeagueControlPage = () => {
    const [activeTab, setActiveTab] = useState('assists');

    const styles = {
        pageContainer: {
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            paddingTop: '1rem',
            paddingBottom: '2rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        },
        navWrapper: {
            maxWidth: '100%',
            padding: '0 1rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
        },
        tabsContainer: {
            display: 'flex',
            backgroundColor: 'white',
            padding: '5px',
            borderRadius: '12px',
            gap: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
        },
        tab: (isActive) => ({
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: isActive ? '700' : '500',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? '#3b82f6' : 'transparent',
            color: isActive ? 'white' : '#6b7280',
            whiteSpace: 'nowrap',
            textAlign: 'center'
        }),
        contentWrapper: {
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0 1rem'
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.navWrapper}>
                <div style={styles.tabsContainer}>
                    <button onClick={() => setActiveTab('assists')} style={styles.tab(activeTab === 'assists')}>
                        Assists
                    </button>
                    <button onClick={() => setActiveTab('penalties')} style={styles.tab(activeTab === 'penalties')}>
                        Penalties
                    </button>
                    <button onClick={() => setActiveTab('locks')} style={styles.tab(activeTab === 'locks')}>
                        Locks
                    </button>
                </div>
            </div>

            <div style={styles.contentWrapper}>
                {activeTab === 'assists' && <AssistManager />}
                {activeTab === 'penalties' && <PenaltyManager />}
                {activeTab === 'locks' && <LockedPlayersManager />}
            </div>
        </div>
    );
};

export default LeagueControlPage;