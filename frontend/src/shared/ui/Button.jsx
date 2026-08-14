"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/src/lib/cn";

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-control border border-transparent px-4 py-2 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,filter,transform,opacity] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-cyan/40 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "border-[var(--button-primary-border)] bg-[linear-gradient(110deg,var(--button-primary-start)_0%,var(--button-primary-end)_100%)] text-white shadow-sm pointer-fine:hover:border-brand-cyan/50 pointer-fine:hover:brightness-110",
                secondary: "border-app-accent-border bg-app-surface-elevated text-app-foreground shadow-sm pointer-fine:hover:border-app-positive-border pointer-fine:hover:bg-app-positive-surface pointer-fine:hover:text-app-positive-foreground",
                success: "border-app-positive-border bg-app-positive-surface text-app-positive-foreground shadow-sm pointer-fine:hover:bg-app-positive-hover",
                danger: "border-app-danger-border bg-app-danger-surface text-app-danger-foreground shadow-sm pointer-fine:hover:bg-red-500 pointer-fine:hover:text-white",
                ghost: "text-app-foreground pointer-fine:hover:bg-app-accent-hover",
                outline: "border-app-border bg-transparent text-app-foreground pointer-fine:hover:border-app-accent-border pointer-fine:hover:bg-app-accent-hover",
                link: "rounded-none border-0 bg-transparent px-0 text-app-accent-foreground underline-offset-4 pointer-fine:hover:text-app-positive-foreground pointer-fine:hover:underline",
            },
            size: {
                sm: "h-9 px-3",
                xs: "h-7 px-2 text-xs",
                md: "h-11 px-5",
                lg: "h-12 px-6 text-base",
                icon: "size-10 p-0",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

const Button = forwardRef(function Button(
    { asChild = false, className, variant, size, type = "button", ...props },
    ref,
) {
    const Component = asChild ? Slot : "button";

    return (
        <Component
            ref={ref}
            type={asChild ? undefined : type}
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
});

export { Button, buttonVariants };
