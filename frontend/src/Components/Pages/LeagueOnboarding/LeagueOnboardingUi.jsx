import { cn } from "../../../lib/cn";
import FormError from "./FormError";
import { Button } from "../../../shared/ui/Button";

export const leagueInputClassName = "h-11 w-full rounded-control border border-app-border bg-app-surface-elevated px-3 text-app-foreground outline-none transition placeholder:text-app-muted/70 focus:border-app-accent focus:ring-3 focus:ring-brand-cyan/20 aria-[invalid=true]:border-app-danger-border aria-[invalid=true]:ring-app-danger-border/20";

export function LeagueOnboardingShell({ eyebrow, title, intro, children, labelledBy }) {
    return (
        <section className="grid min-h-[60dvh] place-items-center px-3 py-8 sm:px-5 sm:py-12" aria-labelledby={labelledBy}>
            <div className="w-full max-w-[51.25rem] rounded-3xl border border-app-border bg-app-surface p-5 shadow-panel sm:p-8 lg:p-10">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-app-accent-foreground">{eyebrow}</p>
                <h1 id={labelledBy} className="mt-2 text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">{title}</h1>
                {intro && <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted sm:text-base">{intro}</p>}
                {children}
            </div>
        </section>
    );
}

export function LeagueModeTabs({ mode, onChange }) {
    return (
        <div className="my-6 grid grid-cols-2 gap-1 rounded-2xl border border-app-border bg-app-surface-muted p-1" role="group" aria-label="League setup options">
            {[{ id: "create", label: "Create league" }, { id: "join", label: "Join league" }].map(({ id, label }) => (
                <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    aria-pressed={mode === id}
                    onClick={() => onChange(id)}
                    className={cn(
                        "min-h-11 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
                        mode === id
                            ? "border border-app-accent-border bg-app-surface-elevated text-app-accent-foreground shadow-sm"
                            : "text-app-muted pointer-fine:hover:bg-app-accent-hover pointer-fine:hover:text-app-foreground",
                    )}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
}

export function LeagueForm({ children, className, ...props }) {
    return <form className={cn("grid gap-4", className)} noValidate {...props}>{children}</form>;
}

export function LeagueField({ label, error, children, className }) {
    return (
        <label className={cn("grid gap-1.5 text-sm font-bold text-app-foreground", className)}>
            {label}
            {children}
            <FormError error={error} />
        </label>
    );
}
