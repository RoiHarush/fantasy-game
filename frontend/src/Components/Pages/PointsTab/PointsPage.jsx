"use client";

import { ChartNoAxesColumnIncreasing, Clock3, Sparkles } from "@/src/shared/ui/icons";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { derivePointsGameweekView } from "../../../features/points/model";
import { usePointsPageData } from "../../../features/points/usePointsPageData";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";

export function PreSeasonPointsState() {
    return (
        <main className="mx-auto flex min-h-[25rem] w-full max-w-5xl items-center px-4 py-10 text-app-foreground sm:min-h-[32rem] sm:px-7 sm:py-14">
            <section className="relative isolate w-full overflow-hidden py-8 text-center sm:py-12" aria-labelledby="preseason-points-title">
                <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-56 w-[min(42rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/7 blur-3xl dark:bg-brand-cyan/5" aria-hidden="true" />
                <div className="mx-auto h-1 w-16 rounded-full bg-component-gradient" aria-hidden="true" />

                <div className="mt-6 flex items-center justify-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-app-accent-foreground sm:text-xs">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Season preview
                </div>

                <ChartNoAxesColumnIncreasing className="mx-auto mt-6 size-9 text-app-accent sm:size-11" strokeWidth={1.7} aria-hidden="true" />
                <h1 id="preseason-points-title" className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-[-0.035em] text-app-foreground sm:text-5xl">
                    Points begin with the first kickoff
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-app-muted sm:text-base sm:leading-7">
                    Scores, player contributions and rankings appear after kickoff.
                </p>

                <div className="mx-auto mt-8 flex w-fit items-center gap-2 border-y border-app-border px-5 py-3 text-xs font-bold text-app-muted sm:text-sm">
                    <Clock3 className="size-4 text-app-accent" aria-hidden="true" />
                    Waiting for Gameweek 1
                </div>
            </section>
        </main>
    );
}

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
        return <PreSeasonPointsState />;
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
            right={<UserSidebar user={targetUser} editable={targetUser?.id === loggedUser?.id} />}
        />
    );
}

export default PointsPage;
