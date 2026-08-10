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

            <h4 className="truncate text-left text-xs font-bold sm:text-sm">
                {title}
            </h4>

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
