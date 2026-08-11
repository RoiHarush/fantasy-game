"use client";

import { X } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

const CloseButton = forwardRef(function CloseButton(
    { className, "aria-label": ariaLabel = "Close", ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type="button"
            aria-label={ariaLabel}
            className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl border border-app-border bg-app-surface-elevated text-app-muted shadow-sm transition",
                "hover:border-app-positive-border hover:bg-app-positive-surface hover:text-app-positive-foreground",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-app-positive-border/55 sm:size-10",
                className,
            )}
            {...props}
        >
            <X className="size-[1.125rem]" strokeWidth={2.25} aria-hidden="true" />
        </button>
    );
});

export default CloseButton;
