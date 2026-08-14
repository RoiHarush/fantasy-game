"use client";

import { Eye, EyeOff } from "@/src/shared/ui/icons";
import { useState } from "react";

import { cn } from "../../lib/cn";
import { Button } from "../../shared/ui/Button";

export const AUTH_INPUT_CLASS_NAME = "h-12 w-full rounded-xl border border-app-border bg-app-surface-elevated pl-11 pr-4 text-base text-app-foreground shadow-sm outline-none transition placeholder:text-app-muted/70 hover:border-app-accent-border focus:border-app-positive-border focus:ring-3 focus:ring-app-positive-border/30 aria-[invalid=true]:border-app-danger-border aria-[invalid=true]:focus:ring-app-danger-border/25";

export function FieldError({ id, error }) {
    if (!error) return null;
    return <p id={id} className="mt-1.5 text-xs font-semibold text-app-danger-foreground">{error.message}</p>;
}

export function AuthenticationField({
    id,
    label,
    placeholder,
    autoComplete,
    registration,
    error,
    icon: Icon,
    type = "text",
    revealable = false,
    inputMode,
    autoCapitalize,
    spellCheck,
}) {
    const [revealed, setRevealed] = useState(false);
    const resolvedType = revealable && revealed ? "text" : type;

    return (
        <div className="min-w-0">
            <label className="mb-2 block text-sm font-bold text-app-foreground" htmlFor={id}>{label}</label>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                <input
                    id={id}
                    {...registration}
                    className={cn(AUTH_INPUT_CLASS_NAME, revealable && "pr-12")}
                    type={resolvedType}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    autoCapitalize={autoCapitalize}
                    spellCheck={spellCheck}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
                {revealable && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRevealed((current) => !current)}
                        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-app-muted transition hover:bg-app-accent-hover hover:text-app-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-positive-border"
                        aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                        aria-pressed={revealed}
                    >
                        {revealed ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
                    </Button>
                )}
            </div>
            <FieldError id={`${id}-error`} error={error} />
        </div>
    );
}
