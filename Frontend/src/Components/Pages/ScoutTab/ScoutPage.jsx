import { useEffect, useState } from "react";
import PageLayout from "../../PageLayout";
import UserSquadSidebar from "../../Sidebar/UserSquadSidebar";
import Scout from "./Scout";
import API_URL from "../../../config";
import { useGameweek } from "../../../Context/GameweeksContext";

function ScoutPage({ user }) {
    const { nextGameweek } = useGameweek();
    const [squad, setSquad] = useState(null);

    useEffect(() => {
        if (nextGameweek && user) {
            fetch(`${API_URL}/api/users/${user.id}/squad?gw=${nextGameweek.id}`)
                .then((res) => res.json())
                .then((data) => setSquad(data))
                .catch((err) => console.error("Failed to fetch squad:", err));
        }
    }, [nextGameweek, user]);

    return (
        <PageLayout
            left={<Scout user={user} />}
            right={<UserSquadSidebar user={user} squad={squad} />}
        />
    );
}

export default ScoutPage;

