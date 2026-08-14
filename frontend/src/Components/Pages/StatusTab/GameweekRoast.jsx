"use client";

import { Flame, Sparkles } from "@/src/shared/ui/icons";

import { useGameweekRoast, useGenerateGameweekRoast } from "../../../features/status/useStatusData";
import { Button } from "../../../shared/ui/Button";

export default function GameweekRoast({ gameweekId }) {
    const roastQuery = useGameweekRoast(gameweekId);
    const generateRoast = useGenerateGameweekRoast(gameweekId);
    const roast = generateRoast.data ?? roastQuery.data;

    return (
        <section className="relative overflow-hidden border-y border-brand-purple/20 py-5" aria-labelledby="gameweek-roast-title">
            <span className="absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-brand-cyan via-brand-purple to-brand-green" aria-hidden="true" />
            <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2 text-brand-purple dark:text-brand-cyan">
                        <Flame className="size-4" aria-hidden="true" />
                        <h2 id="gameweek-roast-title" className="text-xs font-black uppercase tracking-[0.17em]">AI gameweek roast</h2>
                    </div>

                    {roast ? (
                        <p className="max-w-3xl text-pretty text-base leading-relaxed font-semibold text-app-foreground sm:text-lg">
                            “{roast.content}”
                        </p>
                    ) : (
                        <p className="max-w-2xl text-sm leading-relaxed text-app-muted">
                            Your final score, captain and bench are ready. Let the touchline analyst have one honest word.
                        </p>
                    )}

                    {generateRoast.isError && (
                        <p role="alert" className="mt-2 text-sm font-semibold text-red-500 dark:text-red-300">
                            {generateRoast.error?.message || "The roast could not be generated right now."}
                        </p>
                    )}
                </div>

                {!roast && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => generateRoast.mutate()}
                        disabled={generateRoast.isPending || roastQuery.isPending}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-4 py-2.5 text-sm font-extrabold text-app-foreground transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-brand-cyan/60 motion-safe:hover:bg-brand-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:cursor-wait disabled:opacity-55 sm:self-center"
                    >
                        <Sparkles className="size-4 text-brand-cyan" aria-hidden="true" />
                        {generateRoast.isPending ? "Writing…" : roastQuery.isPending ? "Checking…" : "Roast my gameweek"}
                    </Button>
                )}
            </div>
        </section>
    );
}
