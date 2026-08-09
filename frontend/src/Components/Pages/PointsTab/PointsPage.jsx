"use client";

import { ChartNoAxesColumnIncreasing, Clock3 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { derivePointsGameweekView } from "../../../features/points/model";
import { usePointsPageData } from "../../../features/points/usePointsPageData";
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
            <section className="mx-auto grid min-h-[24rem] w-full max-w-3xl place-items-center px-3 py-8 text-app-foreground sm:min-h-[30rem] sm:px-6 sm:py-12">
                <div className="relative w-full overflow-hidden rounded-2xl border border-app-border bg-app-surface px-5 py-8 text-center shadow-panel sm:rounded-3xl sm:px-10 sm:py-12">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-component-gradient" aria-hidden="true" />
                    <div className="pointer-events-none absolute -top-20 left-1/2 size-56 -translate-x-1/2 rounded-full bg-app-accent-surface blur-3xl" aria-hidden="true" />

                    <div className="relative">
                        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground shadow-sm sm:size-14">
                            <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-6 sm:size-7" />
                        </span>
                        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface-muted px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-app-muted sm:text-xs">
                            <Clock3 aria-hidden="true" size={13} />
                            Before Gameweek 1
                        </div>
                        <h1 className="mt-3 text-xl font-black tracking-tight text-app-foreground sm:text-3xl">
                            The season has not started yet
                        </h1>
                        <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-app-muted sm:text-base sm:leading-7">
                            There are no gameweek points to show yet. Scores and rankings will appear here after the first matches begin.
                        </p>
                        <div className="mx-auto mt-6 h-px w-20 bg-app-border" aria-hidden="true" />
                        <p className="mt-4 text-xs font-semibold text-app-muted sm:text-sm">
                            Waiting for the first kickoff
                        </p>
                    </div>
                </div>
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
