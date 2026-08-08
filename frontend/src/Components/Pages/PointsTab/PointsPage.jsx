"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { derivePointsGameweekView } from "../../../features/points/model";
import { usePointsPageData } from "../../../features/points/usePointsPageData";
import { Button } from "../../../shared/ui/Button";
import Style from "../../../Styles/Points.module.css";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";

function PointsPage({ displayedUser }) {
    const { user: loggedUser } = useAuth();
    const gameweekState = useGameweek();
    const [selectedGameweekId, setSelectedGameweekId] = useState(null);

    const targetUser = displayedUser || loggedUser;
    const gameweekView = derivePointsGameweekView({
        ...gameweekState,
        selectedGameweekId,
    });
    const query = usePointsPageData({
        userId: targetUser?.id,
        gameweekId: gameweekView.effectiveGameweek?.id,
        live: gameweekView.isLive,
        enabled: !gameweekView.preSeason,
    });

    if (gameweekState.loading) return <LoadingPage />;
    if (gameweekState.error) return <p role="alert">Error loading gameweeks: {gameweekState.error}</p>;

    if (gameweekView.preSeason) {
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

    if (!gameweekView.effectiveGameweek) {
        return <p role="status">No completed or live gameweek is available yet.</p>;
    }
    if (query.isPending) return <LoadingPage />;
    if (query.error) return <p role="alert">Error loading points: {query.error.message}</p>;
    if (!query.data?.squad) {
        return <p role="status">No saved squad is available for this manager and gameweek.</p>;
    }

    return (
        <PageLayout
            left={
                <Points
                    user={targetUser}
                    squad={query.data?.squad}
                    points={query.data?.points}
                    playerData={query.data?.playerData ?? []}
                    gameweekView={gameweekView}
                    allGameweeks={gameweekState.gameweeks}
                    onSelectGameweek={setSelectedGameweekId}
                />
            }
            right={<UserSidebar user={targetUser} />}
        />
    );
}

export default PointsPage;
