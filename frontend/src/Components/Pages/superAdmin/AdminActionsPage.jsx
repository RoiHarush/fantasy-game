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

const fieldClass = "min-h-11 w-full rounded-xl border border-app-border bg-app-surface-muted px-3 text-sm text-app-foreground outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15 sm:w-auto sm:min-w-40";
const sectionClass = "border-t border-app-border py-6 first:border-t-0";

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
    const handleNotificationTest = (mode) => {
        const forced = mode === "push";
        requestConfirmation({
            title: forced ? "Force a device push to every user?" : "Test notification routing for every user?",
            description: forced
                ? "This bypasses presence so registered devices receive an operating-system push."
                : "Active users receive a toast and inactive users receive a device push.",
            endpoint: `/api/admin/dev/notifications/test?mode=${mode}`,
        });
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
        <div className="mx-auto max-w-5xl">
            <header className="mb-3">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-red-400">Controlled intervention</p>
                <h1 className="mt-1 text-2xl font-black text-app-foreground sm:text-3xl">Emergency actions</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Every operation requires explicit confirmation. Use these controls only to recover or correct persisted season state.</p>
            </header>

            <section className={sectionClass}>
                <h2 className="text-lg font-black text-app-foreground">Gameweek and points</h2>
                <p className="mt-1 text-sm text-app-muted">Open or recalculate one numbered gameweek.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <input
                        type="number"
                        aria-label="Gameweek ID for gameweek actions"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID"
                        className={fieldClass}
                        disabled={loading}
                    />
                    <Button type="button" variant="success" onClick={handleOpenGameweek} disabled={loading}>
                        Open Gameweek
                    </Button>
                    <Button type="button" variant="danger" onClick={handleProcessGameweek} disabled={loading}>
                        Process Gameweek Points
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleUpdatePlayerPoints} disabled={loading}>
                        Update Player Points for GW
                    </Button>
                </div>
            </section>

            <section className={sectionClass}>
                <h2 className="text-lg font-black text-app-foreground">Transfer windows</h2>
                <p className="mt-1 text-sm text-app-muted">Open eligible leagues for a gameweek or stop currently active windows.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <input
                        type="number"
                        aria-label="Gameweek ID for transfer window"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID (for opening)"
                        className={fieldClass}
                        disabled={loading}
                    />
                    <Button type="button" variant="success" onClick={handleOpenTransferWindow} disabled={loading}>
                        Open Transfer Window
                    </Button>
                    <Button type="button" variant="danger" onClick={handleCloseTransferWindow} disabled={loading}>
                        Close Transfer Window
                    </Button>
                </div>
            </section>

            <section className={sectionClass}>
                <h2 className="text-lg font-black text-app-foreground">Upstream data sync</h2>
                <p className="mt-1 text-sm text-app-muted">Refresh FPL schedules and player data without changing league ownership.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button type="button" variant="secondary" onClick={handleUpdateGameweeks} disabled={loading}>
                    Update All Gameweeks
                </Button>
                <Button type="button" variant="secondary" onClick={handleRefreshPlayers} disabled={loading}>
                    Refresh Player List
                </Button>
                <Button type="button" variant="secondary" onClick={handleSyncCurrent} disabled={loading}>
                    Full Sync Current GW
                </Button>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                        type="number"
                        aria-label="Gameweek ID for data synchronization"
                        value={gwInput}
                        onChange={(e) => setGwInput(e.target.value)}
                        placeholder="Gameweek ID"
                        className={fieldClass}
                        disabled={loading}
                    />
                    <Button type="button" onClick={handleSyncForGw} disabled={loading}>
                        Full Sync for Specific GW
                    </Button>
                </div>
            </section>

            <section className={sectionClass}>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-cyan-500">Super admin test</p>
                <h2 className="mt-1 text-lg font-black text-app-foreground">Notification delivery test</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-app-muted">
                    Send a harmless test event to every registered user. No league, squad, points, or transfer data is changed.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button type="button" variant="secondary" onClick={() => handleNotificationTest("route")} disabled={loading}>
                        Test real routing
                    </Button>
                    <Button type="button" onClick={() => handleNotificationTest("push")} disabled={loading}>
                        Force device push
                    </Button>
                </div>
            </section>

            <section className={`${sectionClass} border-red-400/35`}>
                <div className="border-l-2 border-red-400 pl-3"><h2 className="text-lg font-black text-red-500 dark:text-red-300">Manual squad override</h2><p className="mt-1 text-sm text-app-muted">Last-resort repair. This directly replaces a saved squad.</p></div>

                <div className="my-5">
                    <h3 className="mb-2 text-sm font-black text-app-foreground">Player ID finder</h3>
                    <input
                        type="text"
                        aria-label="Search player ID"
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        placeholder="Search player name..."
                        className={`${fieldClass} mb-2 sm:w-full`}
                    />
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-app-border bg-app-surface-muted p-2 text-sm">
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.map(p => (
                                <div key={p.id} className="border-b border-app-border px-2 py-1.5 last:border-b-0">
                                    <strong>{p.viewName}</strong> (ID: {p.id})
                                </div>
                            ))
                        ) : (
                            <span className="text-app-muted">{playerSearch ? 'No players found' : 'Search a name to reveal its player ID.'}</span>
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
                        className="mb-3 max-w-xl"
                    />

                    <input
                        type="number"
                        aria-label="Squad gameweek ID"
                        value={squadGw}
                        onChange={(e) => setSquadGw(e.target.value)}
                        placeholder="Gameweek ID"
                        className={fieldClass}
                        disabled={loading}
                    />
                    <textarea
                        aria-label="Squad JSON"
                        value={squadDto}
                        onChange={(e) => setSquadDto(e.target.value)}
                        placeholder="Paste SquadDto JSON here"
                        className="mt-3 min-h-72 w-full rounded-xl border border-app-border bg-app-surface-muted p-3 font-mono text-xs text-app-foreground outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/15 sm:text-sm"
                        disabled={loading}
                    />
                    <Button type="button" variant="danger" className="mt-3 w-full sm:w-auto" onClick={handleSaveSquad} disabled={loading}>
                        Save Manual Squad
                    </Button>
                </div>
            </section>

            {message.text && (
                <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold break-words ${message.type === "success" ? "border-app-positive-border bg-app-positive-surface text-app-positive-foreground" : "border-app-danger-border bg-app-danger-surface text-app-danger-foreground"}`}
                    role={message.type === "error" ? "alert" : "status"}
                >
                    {message.text}
                </div>
            )}
            {(playersQuery.error || usersQuery.error) && (
                <div className="mt-4 rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground" role="alert">
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
