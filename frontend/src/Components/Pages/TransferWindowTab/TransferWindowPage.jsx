import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchAllUsers } from "../../../services/usersService";
import { fetchTransferWindowState } from "../../../services/transferWindowService";
import { fetchSquadForGameweek } from "../../../services/squadService";
import { useAuth } from "../../../Context/AuthContext";
import PageLayout from "../../PageLayout";
import TransferWindow from "./TransferWindow";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import LoadingPage from "../../General/LoadingPage";

function TransferWindowPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();

    const [users, setUsers] = useState([]);
    const [windowState, setWindowState] = useState(null);

    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const [selectedUserSquad, setSelectedUserSquad] = useState(null);

    const [loadingMain, setLoadingMain] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        async function loadMain() {
            setLoadingMain(true);
            try {
                const [usersData, stateData] = await Promise.all([
                    fetchAllUsers(),
                    fetchTransferWindowState()
                ]);

                if (!cancelled) {
                    setUsers(usersData);
                    setWindowState(stateData);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoadingMain(false);
            }
        }

        loadMain();
        return () => { cancelled = true; };
    }, [user]);

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

    if (loadingMain || !windowState || users.length === 0) {
        return <LoadingPage />;
    }

    if (error) {
        return <div>Error loading transfer window: {error}</div>;
    }

    return (
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
    );
}

export default TransferWindowPage;
