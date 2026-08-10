import Image from "next/image";

import { cn } from "../../../lib/cn";
import { Button } from "../../../shared/ui/Button";

function ChipCard({
    icon,
    iconAlt = "",
    title,
    actionLabel,
    onAction,
    disabled = false,
    active = false,
    actionTitle,
    message = "",
    remaining,
    total,
}) {
    return (
        <section className="grid min-h-15 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[var(--app-accent-border)] bg-[var(--app-surface)] px-2.5 py-2 text-[var(--app-foreground)] shadow-[0_4px_14px_rgba(27,16,53,0.08)] sm:min-h-16 sm:px-3">
            <Image
                src={icon}
                alt={iconAlt}
                width={64}
                height={64}
                className="size-7 object-contain sm:size-8"
            />

            <div className="min-w-0 text-left">
                <h4 className="truncate text-xs font-bold sm:text-sm">{title}</h4>
                {Number.isFinite(remaining) && Number.isFinite(total) && (
                    <span className="mt-0.5 inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[0.58rem] font-bold leading-none text-[var(--app-muted)] sm:text-[0.64rem]">
                        {remaining}/{total} left
                    </span>
                )}
            </div>

            <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                    "h-8 min-h-8 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-surface)] px-2.5 text-[0.72rem] font-bold text-[var(--app-accent-foreground)] hover:bg-[var(--app-accent-hover)] sm:h-9 sm:px-3 sm:text-xs",
                    active && "border-transparent [background:var(--component-gradient)] text-[var(--color-brand-ink)] shadow-sm hover:brightness-110",
                )}
                onClick={onAction}
                disabled={disabled}
                title={actionTitle}
            >
                {actionLabel}
            </Button>

            {message && (
                <p role="status" className="col-span-3 m-0 text-[0.68rem] leading-tight text-[var(--app-muted)] sm:text-xs">
                    {message}
                </p>
            )}
        </section>
    );
}

export default ChipCard;
