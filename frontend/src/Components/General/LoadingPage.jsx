import { Activity, Database, RadioTower, ShieldCheck } from "lucide-react";

const LOADING_SIGNALS = [
    { label: "Live data", Icon: RadioTower },
    { label: "Squads", Icon: ShieldCheck },
    { label: "Gameweek", Icon: Database },
];

export default function LoadingPage({ title = "Preparing your league" }) {
    return (
        <section
            className="relative isolate flex min-h-[min(70dvh,36rem)] w-full items-center justify-center overflow-hidden px-4 py-10 text-app-foreground"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="pointer-events-none absolute -left-20 top-4 size-64 rounded-full bg-brand-purple/10 blur-3xl dark:bg-brand-purple/15" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-16 bottom-2 size-64 rounded-full bg-brand-green/10 blur-3xl dark:bg-brand-cyan/10" aria-hidden="true" />

            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-app-border bg-app-surface/95 px-5 py-8 text-center shadow-[0_24px_80px_rgb(27_16_53_/_16%)] backdrop-blur sm:px-9 sm:py-10 dark:bg-app-surface/95">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-component-gradient" aria-hidden="true" />

                <div className="relative mx-auto mb-6 grid size-24 place-items-center" aria-hidden="true">
                    <div className="absolute inset-0 rounded-full border border-app-accent-border/70" />
                    <div className="absolute inset-1 rounded-full border-2 border-transparent border-r-brand-purple border-t-brand-cyan motion-safe:animate-[spin_1.7s_linear_infinite] motion-reduce:animate-none" />
                    <div className="absolute inset-3 rounded-full border border-transparent border-b-brand-green border-l-app-accent motion-safe:animate-[spin_2.6s_linear_infinite_reverse] motion-reduce:animate-none" />
                    <div className="grid size-14 place-items-center rounded-2xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground shadow-[0_10px_30px_color-mix(in_srgb,var(--app-accent)_18%,transparent)]">
                        <Activity className="size-7" strokeWidth={2.2} />
                    </div>
                </div>

                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-app-accent-foreground">
                    Fantasy Draft System
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">{title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-app-muted sm:text-base">
                    Syncing the latest league state so every screen opens ready for matchday.
                </p>

                <div className="mx-auto mt-6 h-1.5 max-w-sm overflow-hidden rounded-full bg-app-surface-muted" aria-hidden="true">
                    <div className="h-full w-1/3 rounded-full bg-component-gradient shadow-[0_0_18px_var(--brand-cyan)] motion-safe:animate-[loading-scan_1.55s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:animate-none" />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden="true">
                    {LOADING_SIGNALS.map(({ label, Icon }) => (
                        <div key={label} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-app-border bg-app-surface-elevated px-2 py-2 text-[0.68rem] font-bold uppercase tracking-wide text-app-muted sm:text-xs">
                            <Icon className="size-3.5 shrink-0 text-app-positive-foreground" />
                            <span className="truncate">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <span className="sr-only">Loading…</span>
        </section>
    );
}
