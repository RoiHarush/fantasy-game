import { ArrowRight } from "../../shared/ui/icons";
import { Button } from "../../shared/ui/Button";

function SummaryRow({ label, value, pending, last = false }) {
    return (
        <div className={`flex justify-between py-2 text-[0.86rem] ${last ? "" : "border-b border-app-border"}`}>
            <span>{label}</span>
            <span className="font-extrabold text-app-accent-foreground">{pending ? "…" : value ?? "-"}</span>
        </div>
    );
}

export default function PointsSummaryCard({
    user,
    gameweekPoints,
    totalPoints,
    pointsPending = false,
    totalPending = false,
    error = null,
    onOpenHistory,
}) {
    return (
        <section className="w-full overflow-hidden rounded-xl border border-app-border bg-app-surface font-sans text-app-foreground shadow-[0_4px_18px_rgb(27_16_53_/_10%)]">
            <div className="flex items-center gap-2.5 bg-component-gradient px-4 py-3.5 text-brand-ink">
                <div className="flex min-w-0 flex-col">
                    <h3 className="break-words text-base font-bold">{user.name}</h3>
                    <p className="-mt-0.5 break-words text-[0.85rem] opacity-80">{user.fantasyTeamName}</p>
                </div>
            </div>

            <div className="border-b border-app-border bg-brand-ink py-[7px] text-center text-[0.82rem] font-bold text-brand-cyan">
                Points/Rankings
            </div>

            <div className="px-4 py-3 text-app-foreground">
                <SummaryRow label="Gameweek Points" value={gameweekPoints} pending={pointsPending} />
                <SummaryRow label="Overall Points" value={totalPoints} pending={totalPending} last />
            </div>

            {error && (
                <p className="px-4 pb-2 text-xs font-semibold text-app-danger-foreground" role="alert">
                    Some point totals are temporarily unavailable.
                </p>
            )}

            <Button
                type="button"
                variant="link"
                className="block w-full cursor-pointer border-0 bg-transparent px-4 pb-[13px] pt-[9px] text-right text-[0.82rem] font-bold text-app-accent-foreground transition-colors duration-150 focus-visible:bg-app-accent-surface focus-visible:text-app-accent focus-visible:outline-none pointer-fine:hover:bg-app-accent-surface pointer-fine:hover:text-app-accent"
                onClick={onOpenHistory}
            >
                View History <ArrowRight className="ml-1 inline size-3" aria-hidden="true" />
            </Button>
        </section>
    );
}
