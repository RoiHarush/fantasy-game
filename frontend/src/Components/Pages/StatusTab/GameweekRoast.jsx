import { Sparkles } from "@/src/shared/ui/icons";

export default function GameweekRoast() {

    return (
        <section className="relative overflow-hidden border-y border-brand-purple/20 py-5" aria-labelledby="gameweek-roast-title">
            <span className="absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-brand-cyan via-brand-purple to-brand-green" aria-hidden="true" />
            <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2 text-brand-purple dark:text-brand-cyan">
                        <Sparkles className="size-4" aria-hidden="true" />
                        <h2 id="gameweek-roast-title" className="text-xs font-black uppercase tracking-[0.17em]">AI roast</h2>
                    </div>
                    <p className="text-base font-extrabold text-app-foreground sm:text-lg">AI Roast — Coming soon</p>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-app-muted">
                        A playful gameweek verdict is joining the touchline later this season.
                    </p>
                </div>
            </div>
        </section>
    );
}
