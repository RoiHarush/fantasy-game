import { useEffect, useState } from "react";
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

function DraftRoomPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();
    const { subscribe, unsubscribe, connected } = useWebSocket();

    const [users, setUsers] = useState([]);
    const [windowState, setWindowState] = useState(null);
    const [draftConfig, setDraftConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const [selectedUserSquad, setSelectedUserSquad] = useState(null);

    const isAdmin = user?.role?.includes('ADMIN') || user?.roles?.some(r => r.includes('ADMIN'));

    const loadData = async () => {
        if (!user) return;
        try {
            const [usersData, stateData, configData] = await Promise.all([
                fetchAllUsers(),
                fetchTransferWindowState(),
                AdminService.getDraftConfig().catch(() => null)
            ]);
            setUsers(usersData || []);
            setWindowState(stateData || { isOpen: false });
            setDraftConfig(configData);
        } catch (err) {
            console.error("Critical error loading draft room:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadData();
    }, [user]);

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
        };

        subscribe("/topic/transfers", handleDraftEvent);
        return () => unsubscribe("/topic/transfers");
    }, [connected, subscribe, unsubscribe]);

    useEffect(() => {
        if (!nextGameweek || !selectedUserId) return;
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
    }, [selectedUserId, nextGameweek]);

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
                user={user}
                isAdmin={isAdmin}
                config={draftConfig}
                onRefresh={loadData}
            />
        )
    );
}

export default DraftRoomPage;