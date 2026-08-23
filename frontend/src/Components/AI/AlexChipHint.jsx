import { Sparkles } from "@/src/shared/ui/icons";

export default function AlexChipHint({ suggestion }) {
    if (!suggestion) return null;

    const label = suggestion.chipName === "BENCH_BOOST"
        ? "Bench Boost"
        : suggestion.chipName === "TRIPLE_CAPTAIN"
            ? "Triple Captain"
            : "לשמור את הצ׳יפים";

    return (
        <div dir="rtl" className="col-span-full flex items-start gap-2 rounded-xl border border-brand-purple/25 bg-brand-purple/8 px-3 py-2 text-xs text-app-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-purple dark:text-brand-cyan" aria-hidden="true" />
            <p><strong>Alex ממליץ: {label}</strong><span className="text-app-muted"> — {suggestion.reason}</span></p>
        </div>
    );
}
