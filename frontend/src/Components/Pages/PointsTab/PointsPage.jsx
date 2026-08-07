"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { usePointsPageData } from "../../../features/points/usePointsPageData";
import { Button } from "../../../shared/ui/Button";
import Style from "../../../Styles/Points.module.css";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";

function PointsPage({ displayedUser }) {
    const { user: loggedUser } = useAuth();
    const { currentGameweek, nextGameweek, gameweeks, lastGameweek } = useGameweek();
    const [selectedGameweek, setSelectedGameweek] = useState(null);

    const targetUser = displayedUser || loggedUser;
    const effectiveGameweek = selectedGameweek ?? currentGameweek;
    const isPreSeason = !lastGameweek && !currentGameweek && nextGameweek?.status === "UPCOMING";
    const isLive = Boolean(currentGameweek && effectiveGameweek?.id === currentGameweek.id);
    const query = usePointsPageData({
        userId: targetUser?.id,
        gameweekId: effectiveGameweek?.id,
        live: isLive,
        enabled: !isPreSeason,
    });

    if (isPreSeason) {
        return (
            <section className={Style.preSeasonState}>
                <h1>The season has not started yet</h1>
                <p>There are no gameweek points to display.</p>
                <Button asChild size="lg" className="mt-4">
                    <Link href="/pick-team">Prepare your Gameweek 1 squad</Link>
                </Button>
            </section>
        );
    }

    if (!effectiveGameweek || query.isPending) return <LoadingPage />;
    if (query.error) return <div>Error loading points: {query.error.message}</div>;

    return (
        <PageLayout
            left={
                <Points
                    user={targetUser}
                    squad={query.data?.squad}
                    points={query.data?.points}
                    playerData={query.data?.playerData ?? []}
                    selectedGameweek={effectiveGameweek}
                    setSelectedGameweek={setSelectedGameweek}
                    gameweeks={gameweeks}
                    currentGameweek={currentGameweek}
                />
            }
            right={<UserSidebar user={targetUser} />}
        />
    );
}

export default PointsPage;
