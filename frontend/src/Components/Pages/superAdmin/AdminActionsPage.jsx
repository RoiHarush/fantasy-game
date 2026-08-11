"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import {
    useAdminActionData,
    useRunAdminAction,
} from "../../../features/super-admin/useSuperAdmin";
import { manualSquadOverrideSchema } from "../../../features/super-admin/schemas";
import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";

const styles = {
    section: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    h3: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        borderBottom: '2px solid #eee',
        paddingBottom: '8px',
        marginBottom: '16px',
    },
    h4: {
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    button: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '10px',
        marginTop: '10px',
        fontSize: '0.9rem',
    },
    buttonDestructive: {
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '10px',
        marginTop: '10px',
        fontSize: '0.9rem',
    },
    input: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        marginRight: '10px',
        minWidth: '120px',
        height: '40px',
    },
    textarea: {
        width: '100%',
        minHeight: '280px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        marginTop: '10px',
        boxSizing: 'border-box',
    },
    playerFinderInput: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxSizing: 'border-box',
        marginBottom: '8px',
    },
    playerList: {
        maxHeight: '150px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '8px',
        background: '#f9fafb',
    },
    playerListItem: {
        padding: '4px 8px',
        borderBottom: '1px solid #eee',
    },
    message: {
        marginTop: '16px',
        padding: '10px',
        borderRadius: '6px',
        wordBreak: 'break-word',
    },
    success: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
};

const DEFAULT_SQUAD_DTO = {
    startingLineup: {
        GK: [],
        DEF: [],
        MID: [],
        FWD: []
    },
    bench: {
        GK: 0,
        S1: 0,
        S2: 0,
        S3: 0
    },
    formation: {
        GK: 0,
        DEF: 0,
        MID: 0,
        FWD: 0
    },
    captainId: 0,
    viceCaptainId: 0,
    irId: null,
    firstPickId: 0
};

export default function AdminActionsPage() {
    const [gwInput, setGwInput] = useState('');
    const [squadUserId, setSquadUserId] = useState('');
    const [squadGw, setSquadGw] = useState('');
    const [squadDto, setSquadDto] = useState(JSON.stringify(DEFAULT_SQUAD_DTO, null, 2));

    const [message, setMessage] = useState({ text: '', type: '' });
    const [confirmation, setConfirmation] = useState(null);

    const [playerSearch, setPlayerSearch] = useState('');
    const { players: playersQuery, users: usersQuery } = useAdminActionData();
    const allPlayers = useMemo(
        () => (playersQuery.data ?? []).map(player => ({ id: player.id, viewName: player.viewName })),
        [playersQuery.data],
    );
    const allUsersList = useMemo(
        () => (usersQuery.data ?? []).map(user => ({ userId: user.userId, username: user.username })),
        [usersQuery.data],
    );
    const adminAction = useRunAdminAction({
        onSuccess: (responseBody) => {
            const responseText = typeof responseBody === "string"
                ? responseBody
                : responseBody == null ? "Success!" : JSON.stringify(responseBody);
            setMessage({ text: responseText, type: "success" });
        },
        onError: (error) => setMessage({ text: error.message, type: "error" }),
    });
    const loading = adminAction.isPending;

    const filteredPlayers = useMemo(() => {
        if (!playerSearch) {
            return [];
        }
        return allPlayers.filter(p =>
            p.viewName.toLowerCase().includes(playerSearch.toLowerCase())
        );
    }, [allPlayers, playerSearch]);

    const callAdminApi = (endpoint, method = 'POST', body = null) => {
        setMessage({ text: '', type: '' });
        adminAction.mutate({ endpoint, method, body });
    };

    const parseGameweek = () => {
        const gameweek = Number(gwInput);
        if (!Number.isInteger(gameweek) || gameweek < 1 || gameweek > 38) {
            setMessage({ text: "Enter a Gameweek ID between 1 and 38.", type: "error" });
            return null;
        }
        return gameweek;
    };

    const requestConfirmation = ({ title, description, endpoint, method = "POST", body = null }) => {
        setMessage({ text: "", type: "" });
        setConfirmation({ title, description, endpoint, method, body });
    };

    const confirmAdminAction = () => {
        if (!confirmation) return;
        callAdminApi(
            confirmation.endpoint,
            confirmation.method,
            confirmation.body,
        );
        setConfirmation(null);
    };

    const handleOpenGameweek = () => {
        const gameweek = parseGameweek();
        if (!gameweek) return;
        requestConfirmation({ title: `Open Gameweek ${gameweek}?`, description: "This changes the live gameweek state for every league.", endpoint: `/api/admin/open/${gameweek}` });
    };
    const handleProcessGameweek = () => {
        const gameweek = parseGameweek();
        if (!gameweek) return;
        requestConfirmation({ title: `Process Gameweek ${gameweek}?`, description: "Points will be recalculated for every league.", endpoint: `/api/admin/process-gameweek/${gameweek}` });
    };
    const handleUpdatePlayerPoints = () => {
        const gameweek = parseGameweek();
        if (!gameweek) return;
        requestConfirmation({ title: `Update FPL points for Gameweek ${gameweek}?`, description: "Player points will be synchronized from the upstream API.", endpoint: `/api/admin/players/update-points?gw=${gameweek}` });
    };
    const handleOpenTransferWindow = () => {
        const gameweek = parseGameweek();
        if (!gameweek) return;
        requestConfirmation({ title: `Open transfer windows for Gameweek ${gameweek}?`, description: "This affects all eligible leagues immediately.", endpoint: `/api/admin/open-transfer-window/${gameweek}` });
    };
    const handleCloseTransferWindow = () => {
        requestConfirmation({ title: "Close current transfer windows?", description: "Any active transfer turns will be stopped.", endpoint: "/api/admin/close-transfer-window" });
    };
    const handleUpdateGameweeks = () => {
        requestConfirmation({ title: "Update all gameweeks?", description: "Schedules and deadlines will be refreshed from the upstream API.", endpoint: "/api/admin/update-gameweeks" });
    };
    const handleRefreshPlayers = () => {
        requestConfirmation({ title: "Refresh the player list?", description: "Basic player data will be synchronized from the upstream API.", endpoint: "/api/admin/refresh-players" });
    };
    const handleSyncCurrent = () => {
        requestConfirmation({ title: "Synchronize the current gameweek?", description: "Live data for the current gameweek will be refreshed.", endpoint: "/api/admin/sync-current" });
    };
    const handleSyncForGw = () => {
        const gameweek = parseGameweek();
        if (!gameweek) return;
        requestConfirmation({ title: `Synchronize Gameweek ${gameweek}?`, description: "All upstream data for this gameweek will be refreshed.", endpoint: `/api/admin/sync/?gw=${gameweek}` });
    };
    const handleSaveSquad = () => {
        const userId = Number(squadUserId);
        const gameweek = Number(squadGw);
        if (!Number.isInteger(userId) || userId < 1 || !Number.isInteger(gameweek) || gameweek < 1 || gameweek > 38) {
            setMessage({ text: "Select a user and enter a Gameweek ID between 1 and 38.", type: "error" });
            return;
        }
        let parsedJson;
        try {
            parsedJson = JSON.parse(squadDto);
        } catch {
            setMessage({ text: "The squad value is not valid JSON.", type: "error" });
            return;
        }
        const validation = manualSquadOverrideSchema.safeParse(parsedJson);
        if (!validation.success) {
            setMessage({ text: "The squad JSON does not match the required squad structure.", type: "error" });
            return;
        }
        requestConfirmation({
            title: `Overwrite user ${userId}'s Gameweek ${gameweek} squad?`,
            description: "This replaces the saved squad and cannot be automatically undone.",
            endpoint: `/api/admin/user/${userId}/squad/${gameweek}`,
            body: validation.data,
        });
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                System Actions
            </h1>

            <div style={styles.section}>
                <h3 style={styles.h3}>Gameweek & Points Management</h3>
                <div>
                    <input
                        type="number"
                        aria-label="Gameweek ID for gameweek actions"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID"
                        style={styles.input}
                        disabled={loading}
                    />
                    <button type="button" style={styles.button} onClick={handleOpenGameweek} disabled={loading}>
                        Open Gameweek
                    </button>
                    <button type="button" style={styles.buttonDestructive} onClick={handleProcessGameweek} disabled={loading}>
                        Process Gameweek Points
                    </button>
                    <button type="button" style={styles.buttonDestructive} onClick={handleUpdatePlayerPoints} disabled={loading}>
                        Update Player Points for GW
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.h3}>Transfer Window Management</h3>
                <div>
                    <input
                        type="number"
                        aria-label="Gameweek ID for transfer window"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID (for opening)"
                        style={styles.input}
                        disabled={loading}
                    />
                    <button type="button" style={styles.button} onClick={handleOpenTransferWindow} disabled={loading}>
                        Open Transfer Window
                    </button>
                    <button type="button" style={styles.buttonDestructive} onClick={handleCloseTransferWindow} disabled={loading}>
                        Close Transfer Window
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.h3}>Data Sync (API)</h3>
                <button type="button" style={styles.button} onClick={handleUpdateGameweeks} disabled={loading}>
                    Update All Gameweeks
                </button>
                <button type="button" style={styles.button} onClick={handleRefreshPlayers} disabled={loading}>
                    Refresh Player List
                </button>
                <button type="button" style={styles.button} onClick={handleSyncCurrent} disabled={loading}>
                    Full Sync Current GW
                </button>
                <div>
                    <input
                        type="number"
                        aria-label="Gameweek ID for data synchronization"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID"
                        style={{ ...styles.input, marginTop: '10px' }}
                        disabled={loading}
                    />
                    <button type="button" style={styles.button} onClick={handleSyncForGw} disabled={loading}>
                        Full Sync for Specific GW
                    </button>
                </div>
            </div>

            <div style={{ ...styles.section, backgroundColor: '#fffbeb' }}>
                <h3 style={{ ...styles.h3, color: '#b45309' }}>Manual Squad Override (Dangerous)</h3>

                <div style={{ marginBottom: '16px' }}>
                    <h4 style={styles.h4}>Player ID Finder</h4>
                    <input
                        type="text"
                        aria-label="Search player ID"
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        placeholder="Search player name..."
                        style={styles.playerFinderInput}
                    />
                    <div style={styles.playerList}>
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.map(p => (
                                <div key={p.id} style={styles.playerListItem}>
                                    <strong>{p.viewName}</strong> (ID: {p.id})
                                </div>
                            ))
                        ) : (
                            <span style={{ color: '#6b7280' }}>{playerSearch ? 'No players found' : 'name (ID: number)'}</span>
                        )}
                    </div>
                </div>

                <div>
                    <SelectField
                        ariaLabel="Squad owner"
                        value={squadUserId}
                        onValueChange={setSquadUserId}
                        options={[
                            { value: "", label: "Select User" },
                            ...allUsersList.map(user => ({
                                value: user.userId,
                                label: `${user.username} (ID: ${user.userId})`,
                            })),
                        ]}
                        disabled={loading}
                        className="mb-2 max-w-xl"
                    />

                    <input
                        type="number"
                        aria-label="Squad gameweek ID"
                        value={squadGw}
                        onChange={(e) => setSquadGw(e.target.value)}
                        placeholder="Gameweek ID"
                        style={styles.input}
                        disabled={loading}
                    />
                    <textarea
                        aria-label="Squad JSON"
                        value={squadDto}
                        onChange={(e) => setSquadDto(e.target.value)}
                        placeholder="Paste SquadDto JSON here"
                        style={styles.textarea}
                        disabled={loading}
                    />
                    <button type="button" style={styles.buttonDestructive} onClick={handleSaveSquad} disabled={loading}>
                        Save Manual Squad
                    </button>
                </div>
            </div>

            {message.text && (
                <div
                    style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}
                    role={message.type === "error" ? "alert" : "status"}
                >
                    {message.text}
                </div>
            )}
            {(playersQuery.error || usersQuery.error) && (
                <div style={{ ...styles.message, ...styles.error }} role="alert">
                    {(playersQuery.error || usersQuery.error).message}
                </div>
            )}

            {(playersQuery.isPending || usersQuery.isPending) && <p role="status">Loading administration data…</p>}

            <Dialog.Root open={Boolean(confirmation)} onOpenChange={(open) => !open && setConfirmation(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900 p-7 text-center text-white shadow-2xl focus:outline-none">
                        <Dialog.Title className="text-xl font-bold">{confirmation?.title}</Dialog.Title>
                        <Dialog.Description className="mt-3 text-slate-300">
                            {confirmation?.description}
                        </Dialog.Description>
                        <div className="mt-6 flex justify-center gap-3">
                            <Dialog.Close asChild>
                                <Button variant="ghost" className="text-white" disabled={loading}>Cancel</Button>
                            </Dialog.Close>
                            <Button variant="danger" onClick={confirmAdminAction} disabled={loading}>
                                {loading ? "Running…" : "Confirm action"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
