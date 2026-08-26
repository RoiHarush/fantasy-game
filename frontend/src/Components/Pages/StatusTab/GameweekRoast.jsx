"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "@/src/shared/ui/icons";
import { Button } from "../../../shared/ui/Button";
import { roastFeaturesEnabled } from "../../../features/ai/useAlexCoach";
import { useGameweekRoast, useGenerateGameweekRoast } from "../../../features/status/useStatusData";

export default function GameweekRoast({ gameweekId, available = false, manualGenerationAllowed = false, unavailableMessage = "ה-roast ייפתח בסיום המחזור.", featureEnabled = roastFeaturesEnabled, readOnly = false, previewFeed }) {
    const hasPreviewFeed = previewFeed !== undefined;
    const query = useGameweekRoast(gameweekId, featureEnabled && available && !hasPreviewFeed);
    const generate = useGenerateGameweekRoast(gameweekId);
    const [now, setNow] = useState(() => Date.now());
    const [serverOffset, setServerOffset] = useState(0);
    const feed = hasPreviewFeed ? previewFeed : query.data;

    useEffect(() => {
        if (!feed?.serverTimeEpochMs) return;
        const timer = window.setTimeout(() => {
            setServerOffset(feed.serverTimeEpochMs - Date.now());
        }, 0);
        return () => window.clearTimeout(timer);
    }, [feed?.serverTimeEpochMs]);

    useEffect(() => {
        if (!feed?.roasts?.length) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [feed]);

    const current = useMemo(() => {
        if (!feed?.roasts?.length) return null;
        const alignedNow = now + serverOffset;
        const elapsed = Math.max(0, alignedNow - feed.rotationAnchorEpochMs);
        const index = Math.floor(elapsed / (feed.rotationSeconds * 1000)) % feed.roasts.length;
        return feed.roasts[index];
    }, [feed, now, serverOffset]);

    if (!featureEnabled) return null;
    return (
        <section dir="rtl" className="relative overflow-hidden border-y border-brand-purple/20 py-5" aria-labelledby="gameweek-roast-title">
            <span className="absolute inset-y-0 right-0 w-0.5 bg-linear-to-b from-brand-cyan via-brand-purple to-brand-green" aria-hidden="true" />
            <div className="flex flex-col gap-4 pr-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2 text-brand-purple dark:text-brand-cyan">
                        <Sparkles className="size-4" aria-hidden="true" />
                        <h2 id="gameweek-roast-title" className="text-xs font-black uppercase tracking-[0.17em]">League roast</h2>
                    </div>
                    {!available && <p className="text-sm text-app-muted">{unavailableMessage}</p>}
                    {available && !current && <>
                        <p className="text-base font-extrabold text-app-foreground sm:text-lg">ה-roast של הליגה בהכנה</p>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-app-muted">בסיום כל יום משחקים נוצרת לכולם אותה גרסה מעודכנת.</p>
                    </>}
                    {current && <div aria-live="polite">
                        <p className="text-xs font-black text-brand-purple dark:text-brand-cyan">{current.targetDisplayName} · {current.fantasyTeamName}</p>
                        <p className="mt-1 text-base font-extrabold leading-relaxed text-app-foreground sm:text-lg">{current.content}</p>
                    </div>}
                    {(query.error || (!readOnly && generate.error)) && <p role="alert" className="mt-2 text-sm text-app-danger-foreground">{(query.error || generate.error).message}</p>}
                </div>
                {available && manualGenerationAllowed && !current && !readOnly && <Button type="button" size="sm" disabled={generate.isPending} onClick={() => generate.mutate()}>
                    {generate.isPending ? "מכין לכולם…" : "פתח את סבב ה-roast"}
                </Button>}
            </div>
        </section>
    );
}
