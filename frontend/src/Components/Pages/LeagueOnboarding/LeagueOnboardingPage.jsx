"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useScoringDefaults } from "../../../features/league-onboarding/useLeagueOnboarding";
import styles from "../../../Styles/LeagueOnboarding.module.css";
import { getPostLoginRoute } from "../../../Utils/routing";
import CreateLeagueForm from "./CreateLeagueForm";
import FormError from "./FormError";
import JoinLeagueForm from "./JoinLeagueForm";
import LeagueCreatedCard from "./LeagueCreatedCard";

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
        return (
            <LeagueCreatedCard
                league={createdLeague}
                onContinue={() => router.replace("/draft-room")}
            />
        );
    }

    return (
        <section className={styles.page} aria-labelledby="league-onboarding-title">
            <div className={styles.card}>
                <p className={styles.eyebrow}>Welcome to Fantasy Draft</p>
                <h1 id="league-onboarding-title">Choose your league</h1>
                <p className={styles.intro}>Create a league for your group or join one using a code from a friend.</p>

                <div className={styles.tabs} role="group" aria-label="League setup options">
                    <button type="button" aria-pressed={mode === "create"} className={mode === "create" ? styles.activeTab : ""} onClick={() => setMode("create")}>Create league</button>
                    <button type="button" aria-pressed={mode === "join"} className={mode === "join" ? styles.activeTab : ""} onClick={() => setMode("join")}>Join league</button>
                </div>

                {mode === "create" ? (
                    scoringQuery.isPending
                        ? <p role="status">Loading league defaults…</p>
                        : scoringQuery.error
                            ? <FormError error={scoringQuery.error} />
                            : <CreateLeagueForm scoringRules={scoringQuery.data ?? {}} onCreated={handleCreated} />
                ) : <JoinLeagueForm onJoined={handleJoined} />}
            </div>
        </section>
    );
}
