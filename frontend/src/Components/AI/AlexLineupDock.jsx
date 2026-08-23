"use client";

import { Bot, Sparkles } from "@/src/shared/ui/icons";

import { Button } from "../../shared/ui/Button";
import AlexChatBubble from "./AlexChatBubble";

export default function AlexLineupDock({
    analysis,
    busy,
    error,
    previewActive,
    confirmCopy,
    question,
    chatOpen,
    onAnalyze,
    onPreview,
    onCancelPreview,
    onRequestCopy,
    onConfirmCopy,
    onCancelCopy,
    onChatOpenChange,
    onQuestionChange,
    onQuestionSubmit,
}) {
    return (
        <div dir="rtl" className={`relative overflow-hidden rounded-xl border px-3 py-3 text-app-foreground transition-colors duration-300 ${previewActive ? "border-brand-cyan/70 bg-brand-cyan/10" : "border-brand-purple/30 bg-app-background/70"}`}>
            <span className="absolute inset-y-0 right-0 w-1 bg-linear-to-b from-brand-cyan via-brand-purple to-brand-green" aria-hidden="true" />

            <div className="flex flex-wrap items-center justify-between gap-2 pr-1">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 font-black text-brand-purple dark:text-brand-cyan">
                        <Sparkles className={`size-4 ${previewActive ? "motion-safe:animate-pulse" : ""}`} aria-hidden="true" />
                        <span>{previewActive ? "Alex מדגים על המגרש" : "Alex · עוזר המאמן"}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-app-muted">
                        {previewActive
                            ? "זו תצוגה בלבד — ההרכב השמור שלך לא השתנה."
                            : analysis?.summary ?? "נתח את הסגל וקבל הדגמה ישירות על המגרש שלך."}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {!analysis && <Button type="button" size="sm" variant="primary" disabled={busy} onClick={onAnalyze}>{busy ? "מנתח…" : "נתח עם Alex"}</Button>}
                    {analysis && !previewActive && <>
                        <Button type="button" size="sm" variant="primary" onClick={onPreview}>הדגם על המגרש</Button>
                        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onAnalyze}>{busy ? "מנתח…" : "רענן"}</Button>
                    </>}
                    {previewActive && !confirmCopy && <>
                        <Button type="button" size="sm" variant="primary" onClick={onRequestCopy}>העבר לעריכה</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={onCancelPreview}>חזור להרכב שלי</Button>
                    </>}
                    {analysis && <Button type="button" size="sm" variant="secondary" onClick={() => onChatOpenChange(true)}><Bot className="size-4" aria-hidden="true" />שאל את Alex</Button>}
                </div>
            </div>

            {confirmCopy && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2.5 text-xs">
                <span className="font-bold">להעתיק את ההדגמה לעורך? היא עדיין לא תישמר בשרת.</span>
                <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={onConfirmCopy}>כן, העתק</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={onCancelCopy}>ביטול</Button>
                </div>
            </div>}

            {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{error.message}</p>}
            {analysis && <p className="mt-2 text-[0.68rem] text-app-muted">נותרו היום {analysis.quota?.analysesRemainingToday ?? 0} ניתוחים · {analysis.quota?.followupsRemainingThisGameweek ?? 0} שאלות המשך</p>}

            {analysis && <AlexChatBubble
                open={chatOpen}
                onOpenChange={onChatOpenChange}
                messages={analysis.messages}
                question={question}
                onQuestionChange={onQuestionChange}
                onSubmit={onQuestionSubmit}
                busy={busy}
                remaining={analysis.quota?.followupsRemainingThisGameweek}
            />}
        </div>
    );
}
