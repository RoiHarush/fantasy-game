"use client";

import { Moon, Sun } from "@/src/shared/ui/icons";
import { useTheme } from "next-themes";
import { Button } from "../../shared/ui/Button";

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    function toggleTheme() {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Toggle color theme"
            className="relative z-10 ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white shadow-sm backdrop-blur-sm transition hover:scale-105 hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
        >
            <span className="block size-5 dark:hidden"><Sun aria-hidden="true" className="size-5" /></span>
            <span className="hidden size-5 dark:block"><Moon aria-hidden="true" className="size-5" /></span>
        </Button>
    );
}
