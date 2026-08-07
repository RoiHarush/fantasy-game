import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchAllUsers } from "../../../services/usersService";
import { fetchTransferWindowState } from "../../../services/transferWindowService";
import { AdminService } from "../../../services/adminService";
import { useWebSocket } from "../../../Context/WebSocketContext";
import PageLayout from "../../PageLayout";

import LoadingPage from "../../General/LoadingPage";
import TransferWindow from "../TransferWindowTab/TransferWindow";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import { fetchSquadForGameweek } from "../../../services/squadService";
import DraftLobby from "./DraftLobby";
import { fetchMyLeague } from "../../../services/leagueService";

function DraftRoomPage() {
    const { user, updateUser } = useAuth();
    const { nextGameweek } = useGameweek();
    const { subscribe, connected } = useWebSocket();

    const [users, setUsers] = useState([]);
    const [windowState, setWindowState] = useState(null);
    const [draftConfig, setDraftConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const [selectedUserSquad, setSelectedUserSquad] = useState(null);
    const [league, setLeague] = useState(null);
    const [squadRevision, setSquadRevision] = useState(0);

    const isAdmin = Boolean(user?.leagueAdmin);

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [usersData, stateData, configData, leagueData] = await Promise.all([
                fetchAllUsers(),
                fetchTransferWindowState(),
                AdminService.getDraftConfig().catch(() => null),
                fetchMyLeague()
            ]);
            setUsers(usersData || []);
            setWindowState(stateData || { isOpen: false });
            setDraftConfig(configData);
            setLeague(leagueData);
            updateUser({ leagueStatus: leagueData.status });
        } catch (err) {
            console.error("Critical error loading draft room:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, updateUser]);

    useEffect(() => {
        if (user?.id) loadData();
    }, [user?.id, loadData]);

    useEffect(() => {
        if (windowState?.isOpen || league?.status === "ACTIVE") return undefined;
        const timer = window.setInterval(loadData, 5000);
        return () => window.clearInterval(timer);
    }, [league?.status, loadData, windowState?.isOpen]);

    useEffect(() => {
        if (!connected) return;

        const handleDraftEvent = (event) => {
            if (event.event === "window_opened") {
                console.log("Draft window opened via WebSocket!");
                setWindowState(prev => ({
                    ...prev,
                    isOpen: true,
                    isDraftMode: true,
                    currentUserId: event.userId,
                    order: event.turnOrder,
                    initialOrder: event.initialOrder,
                    turnsUsed: event.turnsUsed,
                    totalTurns: event.totalTurns
                }));
            }
            if (event.event === "window_closed" && windowState?.isDraftMode) {
                setWindowState({ isOpen: false, isDraftMode: false });
                setLeague(current => current ? { ...current, status: "ACTIVE", leagueCode: null } : current);
                setDraftConfig(current => current ? { ...current, processed: true } : current);
                updateUser({ leagueStatus: "ACTIVE" });
            }
            if (event.event === "transfer_done" && windowState?.isDraftMode) {
                setSquadRevision(current => current + 1);
            }
        };

        if (!user?.leagueId) return;
        const topic = `/topic/leagues/${user.leagueId}/transfers`;
        return subscribe(topic, handleDraftEvent);
    }, [connected, subscribe, updateUser, user?.leagueId, windowState?.isDraftMode]);

    useEffect(() => {
        if (!windowState?.isOpen || !windowState?.isDraftMode || !nextGameweek || !selectedUserId) {
            setSelectedUserSquad(null);
            return;
        }
        let cancelled = false;
        async function loadSquad() {
            try {
                const data = await fetchSquadForGameweek(selectedUserId, nextGameweek.id);
                if (!cancelled) setSelectedUserSquad(data);
            } catch (err) {
                console.error("Failed to fetch sidebar squad:", err);
            }
        }
        loadSquad();
        return () => { cancelled = true; };
    }, [selectedUserId, nextGameweek, squadRevision, windowState?.isDraftMode, windowState?.isOpen]);

    if (loading || !windowState) return <LoadingPage />;

    return (
        windowState.isOpen && windowState.isDraftMode ? (
            <PageLayout
                left={
                    <TransferWindow
                        user={user}
                        allUsers={users}
                        initialWindowState={windowState}
                    />
                }
                right={
                    <TransferUserSidebar
                        users={users}
                        currentUserId={selectedUserId}
                        onUserChange={setSelectedUserId}
                        squad={selectedUserSquad}
                    />
                }
            />
        ) : (
            <DraftLobby
                isAdmin={isAdmin}
                config={draftConfig}
                league={league}
                onRefresh={loadData}
            />
        )
    );
}

export default DraftRoomPage;
