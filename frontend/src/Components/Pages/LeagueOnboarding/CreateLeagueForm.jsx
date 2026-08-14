"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createLeagueSchema } from "../../../features/league-onboarding/schemas";
import { useCreateLeague } from "../../../features/league-onboarding/useLeagueOnboarding";
import { formatScoringRule, toScoringRuleRows } from "../../../features/league/scoringRules";
import { Button } from "../../../shared/ui/Button";
import FormError from "./FormError";
import { LeagueField, LeagueForm, leagueInputClassName } from "./LeagueOnboardingUi";

export default function CreateLeagueForm({ scoringRules, onCreated }) {
    const scoringRuleRows = toScoringRuleRows(scoringRules);
    const form = useForm({
        resolver: zodResolver(createLeagueSchema),
        defaultValues: {
            leagueName: "",
            teamName: "",
            maxParticipants: 8,
            scoringRules: scoringRuleRows,
        },
    });
    const mutation = useCreateLeague(onCreated);

    return (
        <LeagueForm onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <LeagueField label="League name" error={form.formState.errors.leagueName}>
                <input className={leagueInputClassName} aria-invalid={Boolean(form.formState.errors.leagueName)} {...form.register("leagueName")} />
            </LeagueField>
            <LeagueField label="Maximum participants" error={form.formState.errors.maxParticipants}>
                <input
                    className={leagueInputClassName}
                    type="number"
                    min="2"
                    max="20"
                    aria-invalid={Boolean(form.formState.errors.maxParticipants)}
                    {...form.register("maxParticipants", { valueAsNumber: true })}
                />
            </LeagueField>
            <details className="rounded-2xl border border-app-border bg-app-surface-muted p-4 open:bg-app-surface-elevated">
                <summary className="cursor-pointer font-black text-app-accent-foreground">Customize scoring rules</summary>
                <p className="mt-2 text-sm leading-6 text-app-muted">These values are stored per league and can be changed later by the league admin.</p>
                <div className="mt-4 grid max-h-[26rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                    {scoringRuleRows.map(({ rule }, index) => (
                        <LeagueField key={rule} label={formatScoringRule(rule)} error={form.formState.errors.scoringRules?.[index]?.points} className="rounded-xl border border-app-border bg-app-surface p-3 text-xs">
                            <input type="hidden" {...form.register(`scoringRules.${index}.rule`)} />
                            <input
                                className={leagueInputClassName}
                                type="number"
                                min="-100"
                                max="100"
                                aria-invalid={Boolean(form.formState.errors.scoringRules?.[index]?.points)}
                                {...form.register(`scoringRules.${index}.points`, { valueAsNumber: true })}
                            />
                        </LeagueField>
                    ))}
                </div>
            </details>
            <LeagueField label="Fantasy team name" error={form.formState.errors.teamName}>
                <input className={leagueInputClassName} aria-invalid={Boolean(form.formState.errors.teamName)} {...form.register("teamName")} />
            </LeagueField>
            <FormError error={mutation.error} />
            <Button type="submit" className="mt-1 w-full sm:w-auto sm:justify-self-start" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Create league"}
            </Button>
        </LeagueForm>
    );
}
