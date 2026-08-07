import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchSquadForGameweek } from "../../../services/squadService";
import { useAuth } from "../../../Context/AuthContext";
import PageLayout from "../../PageLayout";
import UserSquadSidebar from "../../Sidebar/UserSquadSidebar";
import Scout from "./Scout";
import LoadingPage from "../../General/LoadingPage";
import { fetchWaiverPlan, saveWaiverPlan } from "../../../services/waiverService";

function ScoutPage() {
    const { user } = useAuth();
    const { nextGameweek, loading: gameweeksLoading, error: gameweeksError } = useGameweek();

    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [waiverEntries, setWaiverEntries] = useState([]);
    const [waiverSaving, setWaiverSaving] = useState(false);
    const [waiverMessage, setWaiverMessage] = useState("");

    useEffect(() => {
        if (!user) return;

        if (!user.leagueId) {
            setSquad(null);
            setError(null);
            setLoading(false);
            return;
        }

        if (gameweeksLoading) {
            setLoading(true);
            return;
        }

        if (!nextGameweek) {
            setSquad(null);
            setError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const [data, plan] = await Promise.all([
                    fetchSquadForGameweek(user.id, nextGameweek.id),
                    fetchWaiverPlan(nextGameweek.id)
                ]);
                if (!cancelled) {
                    setSquad(data);
                    setWaiverEntries(plan || []);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true };
    }, [gameweeksLoading, nextGameweek, user]);

    async function updateWaiverEntries(nextEntries) {
        if (!nextGameweek?.id) return;
        const previous = waiverEntries;
        setWaiverEntries(nextEntries);
        setWaiverSaving(true);
        setWaiverMessage("");
        try {
            const saved = await saveWaiverPlan(nextGameweek.id, nextEntries);
            setWaiverEntries(saved || []);
            setWaiverMessage(`Waiver priorities saved for Gameweek ${nextGameweek.id}.`);
        } catch (saveError) {
            setWaiverEntries(previous);
            setWaiverMessage(saveError.message);
        } finally {
            setWaiverSaving(false);
        }
    }

    if (loading) return <LoadingPage />;

    if (error) return <div>Error loading squad: {error}</div>;

    const sidebar = !user.leagueId ? (
        <aside>
            <h2>Ready to draft?</h2>
            <p>Create or join a league to see your squad alongside the scout.</p>
            <Link href="/onboarding">Create or join a league</Link>
        </aside>
    ) : nextGameweek ? (
        <UserSquadSidebar user={user} squad={squad} />
    ) : (
        <aside>
            <h2>No upcoming gameweek</h2>
            <p>{gameweeksError || "Squad data will appear when an upcoming gameweek is available."}</p>
        </aside>
    );

    return (
        <PageLayout
            left={
                <Scout
                    user={user}
                    squad={squad}
                    waiverEntries={waiverEntries}
                    onWaiverEntriesChange={updateWaiverEntries}
                    waiverSaving={waiverSaving}
                    waiverMessage={waiverMessage}
                    waiverGameweekId={nextGameweek?.id}
                />
            }
            right={sidebar}
        />
    );
}

export default ScoutPage;
