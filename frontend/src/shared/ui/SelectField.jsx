"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../../lib/cn";

const EMPTY_VALUE = "__app-select-empty__";

function SelectField({
    value,
    onValueChange,
    options = [],
    placeholder = "Select an option",
    ariaLabel,
    id,
    className,
    contentClassName,
    disabled = false,
    name,
    required,
}) {
    const normalizedValue = value === "" || value == null ? EMPTY_VALUE : String(value);
    const selectedOption = options.find((option) => {
        const optionValue = option.value === "" || option.value == null
            ? EMPTY_VALUE
            : String(option.value);
        return optionValue === normalizedValue;
    });

    return (
        <Select.Root
            value={normalizedValue}
            onValueChange={(nextValue) => onValueChange?.(nextValue === EMPTY_VALUE ? "" : nextValue)}
            disabled={disabled}
            name={name}
            required={required}
        >
            <Select.Trigger
                id={id}
                aria-label={ariaLabel}
                className={cn(
                    "group inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface-elevated px-3.5 py-2.5 text-left text-sm font-semibold text-app-foreground shadow-sm transition",
                    "hover:border-app-accent-border hover:bg-app-accent-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-app-accent-border/45",
                    "data-placeholder:text-app-muted disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
            >
                <Select.Value placeholder={placeholder}>
                    {selectedOption ? (
                        <span className="flex min-w-0 items-center gap-2">
                            {selectedOption.icon && (
                                <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true">
                                    {selectedOption.icon}
                                </span>
                            )}
                            <span className="truncate">{selectedOption.label}</span>
                        </span>
                    ) : null}
                </Select.Value>
                <Select.Icon className="shrink-0 text-app-muted transition group-data-[state=open]:rotate-180">
                    <ChevronDown className="size-4" aria-hidden="true" />
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content
                    position="popper"
                    sideOffset={6}
                    collisionPadding={12}
                    className={cn(
                        "z-[6500] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl",
                        "data-[state=closed]:animate-out data-[state=open]:animate-in",
                        contentClassName,
                    )}
                >
                    <Select.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-y-auto overscroll-contain p-1.5">
                        {options.map((option) => {
                            const optionValue = option.value === "" || option.value == null
                                ? EMPTY_VALUE
                                : String(option.value);
                            return (
                                <Select.Item
                                    key={optionValue}
                                    value={optionValue}
                                    disabled={option.disabled}
                                    className="relative flex min-h-10 cursor-default select-none items-center rounded-xl py-2 pr-9 pl-3 text-sm font-semibold outline-none transition data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-app-accent-hover data-highlighted:text-app-foreground data-[state=checked]:bg-app-positive-surface data-[state=checked]:text-app-positive-foreground"
                                >
                                    <Select.ItemText>
                                        <span className="flex min-w-0 items-center gap-2.5">
                                            {option.icon && (
                                                <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true">
                                                    {option.icon}
                                                </span>
                                            )}
                                            <span className="truncate">{option.label}</span>
                                        </span>
                                    </Select.ItemText>
                                    <Select.ItemIndicator className="absolute right-3 grid place-items-center text-app-positive-foreground">
                                        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                                    </Select.ItemIndicator>
                                </Select.Item>
                            );
                        })}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

export default SelectField;
