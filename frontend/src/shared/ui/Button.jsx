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
                primary: "bg-gradient-to-r from-brand-purple to-brand-cyan text-white shadow-sm hover:brightness-105",
                secondary: "border-brand-cyan bg-white text-brand-ink hover:bg-cyan-50",
                danger: "bg-red-500 text-white shadow-sm hover:bg-red-600",
                ghost: "text-brand-ink hover:bg-slate-100",
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
