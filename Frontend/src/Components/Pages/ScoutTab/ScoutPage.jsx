import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchSquadForGameweek } from "../../../services/squadService";
import PageLayout from "../../PageLayout";
import UserSquadSidebar from "../../Sidebar/UserSquadSidebar";
import Scout from "./Scout";
import LoadingPage from "../../General/LoadingPage";

function ScoutPage({ user }) {
    const { nextGameweek } = useGameweek();

    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!nextGameweek || !user) return;

        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const data = await fetchSquadForGameweek(user.id, nextGameweek.id);
                if (!cancelled) setSquad(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true };
    }, [nextGameweek, user]);

    if (loading) return <LoadingPage />;

    if (error) return <div>Error loading squad: {error}</div>;

    return (
        <PageLayout
            left={<Scout user={user} />}
            right={<UserSquadSidebar user={user} squad={squad} />}
        />
    );
}

export default ScoutPage;
