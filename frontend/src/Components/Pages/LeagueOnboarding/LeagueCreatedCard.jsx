"use client";

import { useState } from "react";

import { Button } from "../../../shared/ui/Button";
import { LeagueOnboardingShell } from "./LeagueOnboardingUi";

export default function LeagueCreatedCard({ league, onContinue }) {
    const [copyStatus, setCopyStatus] = useState("idle");

    async function copyLeagueCode() {
        try {
            await navigator.clipboard.writeText(league.leagueCode);
            setCopyStatus("copied");
        } catch {
            setCopyStatus("failed");
        }
    }

    const copyLabel = copyStatus === "copied"
        ? "Code copied!"
        : copyStatus === "failed"
            ? "Copy failed — select the code above"
            : "Copy league code";

    return (
        <LeagueOnboardingShell
            eyebrow="League created"
            title="Invite your managers"
            intro="Share this code before the initial draft begins:"
            labelledBy="league-created-title"
        >
                <div className="my-7 overflow-hidden rounded-2xl border border-app-accent-border bg-app-accent-surface px-4 py-5 text-center font-mono text-3xl font-black tracking-[.16em] text-app-accent-foreground sm:text-4xl">{league.leagueCode}</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={copyLeagueCode}>
                    {copyLabel}
                </Button>
                <Button type="button" onClick={onContinue}>
                    Set up initial draft
                </Button>
                </div>
        </LeagueOnboardingShell>
    );
}
