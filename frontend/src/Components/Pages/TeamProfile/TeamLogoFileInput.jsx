"use client";

export default function TeamLogoFileInput({ onChoose, ariaLabel = "Choose team image" }) {
    return (
        <input
            type="file"
            accept="image/*"
            aria-label={ariaLabel}
            className="h-11 w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border border-app-accent-border bg-app-accent-surface text-transparent file:h-full file:w-full file:cursor-pointer file:border-0 file:bg-transparent file:px-3 file:text-xs file:font-black file:text-app-accent-foreground hover:bg-app-accent-hover focus:border-app-accent-border focus:outline-none focus:ring-3 focus:ring-app-accent-surface"
            onClick={(event) => {
                event.currentTarget.value = "";
            }}
            onChange={(event) => {
                onChoose(event.currentTarget.files?.[0] ?? null);
            }}
        />
    );
}
