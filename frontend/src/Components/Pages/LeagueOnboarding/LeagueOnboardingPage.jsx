"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../../Context/AuthContext";
import { createLeagueSchema, joinLeagueSchema } from "../../../features/league-onboarding/schemas";
import {
    useCreateLeague,
    useJoinLeague,
    useScoringDefaults,
} from "../../../features/league-onboarding/useLeagueOnboarding";
import { Button } from "../../../shared/ui/Button";
import styles from "../../../Styles/LeagueOnboarding.module.css";
import { getPostLoginRoute } from "../../../Utils/routing";

function FormError({ error }) {
    if (!error) return null;
    return <p className={styles.error} role="alert">{error.message}</p>;
}

function CreateLeagueForm({ scoringRules, onCreated }) {
    const form = useForm({
        resolver: zodResolver(createLeagueSchema),
        defaultValues: {
            leagueName: "",
            teamName: "",
            maxParticipants: 8,
            scoringRules,
        },
    });
    const mutation = useCreateLeague(onCreated);

    return (
        <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className={styles.form} noValidate>
            <label>
                League name
                <input aria-invalid={Boolean(form.formState.errors.leagueName)} {...form.register("leagueName")} />
                <FormError error={form.formState.errors.leagueName} />
            </label>
            <label>
                Maximum participants
                <input type="number" min="2" max="20" aria-invalid={Boolean(form.formState.errors.maxParticipants)} {...form.register("maxParticipants", { valueAsNumber: true })} />
                <FormError error={form.formState.errors.maxParticipants} />
            </label>
            <details className={styles.scoringSettings}>
                <summary>Customize scoring rules</summary>
                <p>These values are stored per league and can be changed later by the league admin.</p>
                <div className={styles.scoringGrid}>
                    {Object.entries(scoringRules).map(([rule]) => (
                        <label key={rule}>
                            {rule.replaceAll("_", " ").replace(".", " · ")}
                            <input
                                type="number"
                                min="-100"
                                max="100"
                                {...form.register(`scoringRules.${rule}`, { valueAsNumber: true })}
                            />
                        </label>
                    ))}
                </div>
            </details>
            <label>
                Fantasy team name
                <input aria-invalid={Boolean(form.formState.errors.teamName)} {...form.register("teamName")} />
                <FormError error={form.formState.errors.teamName} />
            </label>
            <FormError error={mutation.error} />
            <Button type="submit" className={styles.submit} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Create league"}
            </Button>
        </form>
    );
}

function JoinLeagueForm({ onJoined }) {
    const form = useForm({
        resolver: zodResolver(joinLeagueSchema),
        defaultValues: { leagueCode: "", teamName: "" },
    });
    const mutation = useJoinLeague(onJoined);

    return (
        <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className={styles.form} noValidate>
            <label>
                League code
                <input
                    minLength="6"
                    maxLength="12"
                    aria-invalid={Boolean(form.formState.errors.leagueCode)}
                    {...form.register("leagueCode", { setValueAs: value => value.toUpperCase() })}
                />
                <FormError error={form.formState.errors.leagueCode} />
            </label>
            <label>
                Fantasy team name
                <input aria-invalid={Boolean(form.formState.errors.teamName)} {...form.register("teamName")} />
                <FormError error={form.formState.errors.teamName} />
            </label>
            <FormError error={mutation.error} />
            <Button type="submit" className={styles.submit} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Join league"}
            </Button>
        </form>
    );
}

export default function LeagueOnboardingPage() {
    const [mode, setMode] = useState("create");
    const [createdLeague, setCreatedLeague] = useState(null);
    const [copied, setCopied] = useState(false);
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
            <section className={styles.page} aria-labelledby="league-created-title">
                <div className={styles.card}>
                    <p className={styles.eyebrow}>League created</p>
                    <h1 id="league-created-title">Invite your managers</h1>
                    <p>Share this code before the initial draft begins:</p>
                    <div className="my-6 text-4xl font-extrabold tracking-[.16em]">{createdLeague.leagueCode}</div>
                    <Button type="button" variant="secondary" onClick={async () => {
                        await navigator.clipboard.writeText(createdLeague.leagueCode);
                        setCopied(true);
                    }}>
                        {copied ? "Code copied!" : "Copy league code"}
                    </Button>
                    <Button type="button" className={styles.submit} onClick={() => router.replace("/draft-room")}>Set up initial draft</Button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.page} aria-labelledby="league-onboarding-title">
            <div className={styles.card}>
                <p className={styles.eyebrow}>Welcome to Fantasy Draft</p>
                <h1 id="league-onboarding-title">Choose your league</h1>
                <p className={styles.intro}>Create a league for your group or join one using a code from a friend.</p>

                <div className={styles.tabs} role="tablist" aria-label="League setup options">
                    <button type="button" role="tab" aria-selected={mode === "create"} className={mode === "create" ? styles.activeTab : ""} onClick={() => setMode("create")}>Create league</button>
                    <button type="button" role="tab" aria-selected={mode === "join"} className={mode === "join" ? styles.activeTab : ""} onClick={() => setMode("join")}>Join league</button>
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
