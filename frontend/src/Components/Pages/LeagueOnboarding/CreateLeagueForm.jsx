"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createLeagueSchema } from "../../../features/league-onboarding/schemas";
import { useCreateLeague } from "../../../features/league-onboarding/useLeagueOnboarding";
import { formatScoringRule, toScoringRuleRows } from "../../../features/league/scoringRules";
import { Button } from "../../../shared/ui/Button";
import styles from "../../../Styles/LeagueOnboarding.module.css";
import FormError from "./FormError";

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
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className={styles.form} noValidate>
            <label>
                League name
                <input aria-invalid={Boolean(form.formState.errors.leagueName)} {...form.register("leagueName")} />
                <FormError error={form.formState.errors.leagueName} />
            </label>
            <label>
                Maximum participants
                <input
                    type="number"
                    min="2"
                    max="20"
                    aria-invalid={Boolean(form.formState.errors.maxParticipants)}
                    {...form.register("maxParticipants", { valueAsNumber: true })}
                />
                <FormError error={form.formState.errors.maxParticipants} />
            </label>
            <details className={styles.scoringSettings}>
                <summary>Customize scoring rules</summary>
                <p>These values are stored per league and can be changed later by the league admin.</p>
                <div className={styles.scoringGrid}>
                    {scoringRuleRows.map(({ rule }, index) => (
                        <label key={rule}>
                            {formatScoringRule(rule)}
                            <input type="hidden" {...form.register(`scoringRules.${index}.rule`)} />
                            <input
                                type="number"
                                min="-100"
                                max="100"
                                aria-invalid={Boolean(form.formState.errors.scoringRules?.[index]?.points)}
                                {...form.register(`scoringRules.${index}.points`, { valueAsNumber: true })}
                            />
                            <FormError error={form.formState.errors.scoringRules?.[index]?.points} />
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
