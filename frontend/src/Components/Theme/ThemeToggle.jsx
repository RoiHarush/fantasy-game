"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    function toggleTheme() {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Toggle color theme"
            className="relative z-10 ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white shadow-sm backdrop-blur-sm transition hover:scale-105 hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
        >
            <Sun aria-hidden="true" className="size-5 dark:hidden" />
            <Moon aria-hidden="true" className="hidden size-5 dark:block" />
        </button>
    );
}
