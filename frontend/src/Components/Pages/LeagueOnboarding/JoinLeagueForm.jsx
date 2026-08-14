"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { joinLeagueSchema } from "../../../features/league-onboarding/schemas";
import { useJoinLeague } from "../../../features/league-onboarding/useLeagueOnboarding";
import { Button } from "../../../shared/ui/Button";
import FormError from "./FormError";
import { LeagueField, LeagueForm, leagueInputClassName } from "./LeagueOnboardingUi";

export default function JoinLeagueForm({ onJoined }) {
    const form = useForm({
        resolver: zodResolver(joinLeagueSchema),
        defaultValues: { leagueCode: "", teamName: "" },
    });
    const mutation = useJoinLeague(onJoined);

    return (
        <LeagueForm onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <LeagueField label="League code" error={form.formState.errors.leagueCode}>
                <input
                    className={leagueInputClassName}
                    minLength="6"
                    maxLength="12"
                    autoCapitalize="characters"
                    spellCheck="false"
                    aria-invalid={Boolean(form.formState.errors.leagueCode)}
                    {...form.register("leagueCode", { setValueAs: (value) => value.trim().toUpperCase() })}
                />
            </LeagueField>
            <LeagueField label="Fantasy team name" error={form.formState.errors.teamName}>
                <input className={leagueInputClassName} aria-invalid={Boolean(form.formState.errors.teamName)} {...form.register("teamName")} />
            </LeagueField>
            <FormError error={mutation.error} />
            <Button type="submit" className="mt-1 w-full sm:w-auto sm:justify-self-start" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Join league"}
            </Button>
        </LeagueForm>
    );
}
