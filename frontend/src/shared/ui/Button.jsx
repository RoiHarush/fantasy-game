"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/src/lib/cn";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-control border border-transparent px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-cyan/40 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "border-[#704a82] bg-[linear-gradient(110deg,#4f285f_0%,#255b68_100%)] text-white shadow-sm pointer-fine:hover:border-brand-cyan/50 pointer-fine:hover:brightness-110",
                secondary: "border-app-accent-border bg-app-surface-elevated text-app-foreground shadow-sm pointer-fine:hover:border-app-positive-border pointer-fine:hover:bg-app-positive-surface pointer-fine:hover:text-app-positive-foreground",
                success: "border-app-positive-border bg-app-positive-surface text-app-positive-foreground shadow-sm pointer-fine:hover:bg-app-positive-hover",
                danger: "bg-red-500 text-white shadow-sm pointer-fine:hover:bg-red-600",
                ghost: "text-app-foreground pointer-fine:hover:bg-app-accent-hover",
            },
            size: {
                sm: "h-9 px-3",
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
