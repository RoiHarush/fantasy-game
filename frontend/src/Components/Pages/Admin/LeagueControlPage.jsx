import React, { useEffect, useState } from 'react';
import AssistManager from './AssistManager';
import LockedPlayersManager from './LockedPlayersManager';
import { useGameweek } from '../../../Context/GameweeksContext';

const LeagueControlPage = () => {
    const [activeTab, setActiveTab] = useState('locks');
    const [canManageAssist, setCanManageAssist] = useState(true);
    const { currentGameweek } = useGameweek();

    const styles = {
        pageContainer: {
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            paddingTop: '2rem',
            fontFamily: 'sans-serif',
        },
        navWrapper: {
            maxWidth: '800px',
            margin: '0 auto 2rem auto',
            display: 'flex',
            justifyContent: 'center'
        },
        tabsContainer: {
            display: 'flex',
            backgroundColor: '#e5e7eb',
            padding: '4px',
            borderRadius: '9999px',
            gap: '4px'
        },
        tab: (isActive) => ({
            padding: '8px 24px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? 'white' : 'transparent',
            color: isActive ? '#111827' : '#6b7280',
            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }),
        contentWrapper: {

        }
    };

    useEffect(() => {
        if (!currentGameweek) return;
        setCanManageAssist(!currentGameweek.calculated);

    }, [currentGameweek]);

    return (
        <div style={styles.pageContainer}>

            <div style={styles.navWrapper}>
                <div style={styles.tabsContainer}>
                    <button
                        onClick={() => setActiveTab('assists')}
                        style={styles.tab(activeTab === 'assists')}
                        disabled={canManageAssist}
                    >
                        Assist Control
                    </button>
                    <button
                        onClick={() => setActiveTab('locks')}
                        style={styles.tab(activeTab === 'locks')}
                    >
                        Player Locks
                    </button>
                </div>
            </div>

            <div style={styles.contentWrapper}>
                {activeTab === 'assists' ? (
                    <AssistManager />
                ) : (
                    <LockedPlayersManager />
                )}
            </div>
        </div>
    );
};

export default LeagueControlPage;