import { useMemo, useState } from 'react';
import PlayerKit from '../../General/PlayerKit';
import { usePlayers } from '../../../features/players/usePlayers';
import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useUpdatePlayerPosition } from "../../../features/league-admin/useLeagueAdmin";

const POSITIONS = [
    { id: 1, code: "GK", label: "Goalkeeper" },
    { id: 2, code: "DEF", label: "Defender" },
    { id: 3, code: "MID", label: "Midfielder" },
    { id: 4, code: "FWD", label: "Forward" },
];

const PositionManager = ({ maintenanceLeagueId = null }) => {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const [searchTerm, setSearchTerm] = useState("");
    const updatePosition = useUpdatePlayerPosition(maintenanceLeagueId);

    const searchResults = useMemo(
        () => findPlayers(players, searchTerm, { availableOnly: true }),
        [players, searchTerm],
    );

    const handleChangePosition = (player, position) => {
        updatePosition.mutate({
            playerId: player.id,
            positionId: position.id,
            positionCode: position.code,
        });
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
                    aria-label="Search free agents"
                    placeholder="Search free agents..."
                    style={styles.input}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {playersQuery.isPending && <p role="status">Loading players…</p>}
                {(playersQuery.error || updatePosition.error) && (
                    <p role="alert">{playersQuery.error?.message || updatePosition.error?.message || "Update failed."}</p>
                )}

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
                                {POSITIONS.map(pos => (
                                    <button
                                        type="button"
                                        key={pos.id}
                                        disabled={updatePosition.isPending && updatePosition.variables?.playerId === p.id}
                                        onClick={() => handleChangePosition(p, pos)}
                                        style={styles.posBtn(p.position === pos.code)}
                                        aria-pressed={p.position === pos.code}
                                        aria-label={`Set ${p.viewName} as ${pos.label}`}
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
