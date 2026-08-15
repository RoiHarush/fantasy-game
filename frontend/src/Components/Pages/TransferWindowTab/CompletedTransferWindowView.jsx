import { CheckCircle2, Clock3 } from "@/src/shared/ui/icons";

export default function CompletedTransferWindowView({ gameweekId }) {
    return (
        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-12 text-app-foreground sm:px-7 sm:py-20">
            <section className="w-full border-y border-app-border py-9 sm:py-12" aria-labelledby="completed-transfer-window-title">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-app-positive-surface text-app-positive-foreground ring-1 ring-app-positive-border">
                        <CheckCircle2 className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.17em] text-app-positive-foreground">
                            <span>Window complete</span>
                            {gameweekId && <span className="text-app-muted">· GW {gameweekId}</span>}
                        </div>
                        <h1 id="completed-transfer-window-title" className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">
                            Transfers are complete
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted sm:text-base sm:leading-7">
                            Every scheduled pick for this gameweek has been processed. The next transfer window will appear when the next gameweek becomes upcoming.
                        </p>
                        <p className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-app-accent-foreground">
                            <Clock3 className="size-4" aria-hidden="true" />
                            Waiting for the gameweek to begin
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
