import { Activity } from "@/src/shared/ui/icons";

export default function LoadingPage({
    title = "Preparing your league",
    eyebrow = "Fantasy Draft",
    description = "Syncing the latest league state so every screen opens ready for matchday.",
}) {
    return (
        <section
            className="relative isolate grid min-h-[min(68dvh,34rem)] w-full place-items-center overflow-hidden px-5 py-12 text-app-foreground"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="w-full max-w-md text-center">
                <div className="relative mx-auto mb-5 grid size-16 place-items-center" aria-hidden="true">
                    <div className="absolute inset-0 rounded-full border-2 border-app-border" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-brand-purple border-t-brand-cyan motion-safe:animate-[spin_1.15s_linear_infinite] motion-reduce:animate-none" />
                    <Activity className="size-6 text-app-accent-foreground" strokeWidth={2.25} />
                </div>

                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-app-accent-foreground">{eyebrow}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-app-muted sm:text-base">{description}</p>

                <div className="mx-auto mt-6 h-1 max-w-64 overflow-hidden rounded-full bg-app-border" aria-hidden="true">
                    <div className="h-full w-1/3 rounded-full bg-component-gradient motion-safe:animate-[loading-scan_1.45s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:animate-none" />
                </div>
            </div>

            <span className="sr-only">Loading…</span>
        </section>
    );
}
