"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { joinLeagueSchema } from "../../../features/league-onboarding/schemas";
import { useJoinLeague } from "../../../features/league-onboarding/useLeagueOnboarding";
import { Button } from "../../../shared/ui/Button";
import styles from "../../../Styles/LeagueOnboarding.module.css";
import FormError from "./FormError";

export default function JoinLeagueForm({ onJoined }) {
    const form = useForm({
        resolver: zodResolver(joinLeagueSchema),
        defaultValues: { leagueCode: "", teamName: "" },
    });
    const mutation = useJoinLeague(onJoined);

    return (
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className={styles.form} noValidate>
            <label>
                League code
                <input
                    minLength="6"
                    maxLength="12"
                    autoCapitalize="characters"
                    spellCheck="false"
                    aria-invalid={Boolean(form.formState.errors.leagueCode)}
                    {...form.register("leagueCode", { setValueAs: (value) => value.trim().toUpperCase() })}
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
