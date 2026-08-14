"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useScoringDefaults } from "../../../features/league-onboarding/useLeagueOnboarding";
import { getPostLoginRoute } from "../../../Utils/routing";
import CreateLeagueForm from "./CreateLeagueForm";
import FormError from "./FormError";
import JoinLeagueForm from "./JoinLeagueForm";
import LeagueCreatedCard from "./LeagueCreatedCard";
import { LeagueModeTabs, LeagueOnboardingShell } from "./LeagueOnboardingUi";

export default function LeagueOnboardingPage() {
    const [mode, setMode] = useState("create");
    const [createdLeague, setCreatedLeague] = useState(null);
    const { refreshCurrentUser } = useAuth();
    const router = useRouter();
    const scoringQuery = useScoringDefaults();

    async function handleCreated(league) {
        setCreatedLeague(league);
        await refreshCurrentUser();
    }

    async function handleJoined() {
        const currentUser = await refreshCurrentUser();
        router.replace(getPostLoginRoute(currentUser));
        router.refresh();
    }

    if (createdLeague) {
        return <LeagueCreatedCard league={createdLeague} onContinue={() => router.replace("/draft-room")} />;
    }

    return (
        <LeagueOnboardingShell
            eyebrow="Welcome to Fantasy Draft"
            title="Choose your league"
            intro="Create a league for your group or join one using a code from a friend."
            labelledBy="league-onboarding-title"
        >
            <LeagueModeTabs mode={mode} onChange={setMode} />
            {mode === "create" ? (
                scoringQuery.isPending
                    ? <p className="text-sm text-app-muted" role="status">Loading league defaults…</p>
                    : scoringQuery.error
                        ? <FormError error={scoringQuery.error} />
                        : <CreateLeagueForm scoringRules={scoringQuery.data ?? {}} onCreated={handleCreated} />
            ) : <JoinLeagueForm onJoined={handleJoined} />}
        </LeagueOnboardingShell>
    );
}
