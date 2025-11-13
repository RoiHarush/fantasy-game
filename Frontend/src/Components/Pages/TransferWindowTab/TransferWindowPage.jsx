import { useEffect, useState } from "react";
import PageLayout from "../../PageLayout";
import TransferWindow from "./TransferWindow";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import API_URL from "../../../config";

function TransferWindowPage({ user }) {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(user?.id);

    useEffect(() => {
        fetch(`${API_URL}/api/users`)
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch((err) => console.error("Failed to fetch users:", err));
    }, []);

    return (
        <PageLayout
            left={
                <TransferWindow
                    initialUser={users.find((u) => u.id === selectedUserId) || user}
                />
            }
            right={
                <TransferUserSidebar
                    users={users}
                    currentUserId={selectedUserId}
                    onUserChange={(id) => setSelectedUserId(id)}
                />
            }
        />
    );
}

export default TransferWindowPage;
