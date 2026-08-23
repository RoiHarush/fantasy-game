"use client";

import { useMemo, useState } from "react";
import { Bot, Sparkles } from "@/src/shared/ui/icons";
import { Button } from "../../shared/ui/Button";
import { usePlayers } from "../../features/players/usePlayers";
import { aiFeaturesEnabled, useAlexCoach } from "../../features/ai/useAlexCoach";
import AlexTransferCards from "./AlexTransferCards";
import AlexChatBubble from "./AlexChatBubble";

export default function AlexCoachPanel({ gameweekId, mode, draftSquad, onUseTransfer }) {
    const coach = useAlexCoach(gameweekId, Boolean(gameweekId));
    const playersQuery = usePlayers({ enabled: Boolean(aiFeaturesEnabled && gameweekId) });
    const [question, setQuestion] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const playersById = useMemo(() => new Map(playersQuery.players.map((player) => [String(player.id), player])), [playersQuery.players]);

    if (!aiFeaturesEnabled || !gameweekId) return null;

    const analysis = coach.analysis;
    const busy = coach.analyze.isPending || coach.ask.isPending;
    const error = coach.analyze.error || coach.ask.error || coach.error;
    function requestTransferApply(transfer) {
        setPendingAction({ type: "transfer", value: transfer });
    }
    function confirmApply() {
        if (pendingAction?.type === "transfer") onUseTransfer?.(pendingAction.value);
        setPendingAction(null);
    }
    async function sendQuestion(event) {
        event.preventDefault();
        if (!question.trim()) return;
        await coach.ask.mutateAsync(question.trim()).catch(() => undefined);
        setQuestion("");
    }

    return (
        <section dir="rtl" className="relative overflow-hidden rounded-2xl border border-brand-purple/30 bg-app-surface p-4 text-app-foreground shadow-panel sm:p-5" aria-labelledby={`alex-${mode}`}>
            <span className="absolute inset-y-0 right-0 w-1 bg-linear-to-b from-brand-cyan via-brand-purple to-brand-green" aria-hidden="true" />
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-brand-purple dark:text-brand-cyan">
                        <Sparkles className="size-4" aria-hidden="true" />
                        <h2 id={`alex-${mode}`} className="text-lg font-black">Alex · עוזר המאמן</h2>
                    </div>
                    <p className="mt-1 text-sm text-app-muted">
                        שדרוגים אפשריים לסגל לקראת חלון ההעברות. Alex לעולם לא שומר שינוי בעצמו.
                    </p>
                </div>
                <div className="flex gap-2">
                    {analysis && <Button type="button" size="sm" variant="secondary" onClick={() => setChatOpen(true)}><Bot className="size-4" aria-hidden="true" />שאל את Alex</Button>}
                    <Button type="button" size="sm" variant="primary" disabled={busy}
                            onClick={() => coach.analyze.mutate({ mode, draftSquad })}>
                        {coach.analyze.isPending ? "מנתח…" : analysis ? "רענון ניתוח" : "נתח עכשיו"}
                    </Button>
                </div>
            </div>

            {error && <p role="alert" className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm">{error.message}</p>}
            {analysis && <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-app-border bg-app-background/55 p-3">
                    <p className="whitespace-pre-line text-sm leading-6">{analysis.summary}</p>
                    <p className="mt-2 text-xs text-app-muted">עודכן: {formatAnalysisDate(analysis.dataAsOf)} · {analysis.generatedByAi ? "נוסח בעזרת מכסת AI חינמית" : "מנוע מקומי חינמי"}</p>
                </div>

                <div>
                    <h3 className="mb-3 text-base font-black">העברות שכדאי לבדוק</h3>
                    <AlexTransferCards transfers={analysis.transfers} playersById={playersById} onSelect={onUseTransfer ? requestTransferApply : undefined} />
                </div>

                <p className="text-xs text-app-muted">נותרו היום {analysis.quota?.analysesRemainingToday ?? 0} ניתוחים · {analysis.quota?.followupsRemainingThisGameweek ?? 0} שאלות המשך במחזור</p>
            </div>}

            {analysis && <AlexChatBubble
                open={chatOpen}
                onOpenChange={setChatOpen}
                messages={analysis.messages}
                question={question}
                onQuestionChange={setQuestion}
                onSubmit={sendQuestion}
                busy={busy}
                remaining={analysis.quota?.followupsRemainingThisGameweek}
            />}

            {pendingAction && <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3">
                <p className="text-sm font-bold">לאשר העתקה לטופס?</p>
                <p className="mt-1 text-xs text-app-muted">הפעולה לא תשמור בשרת. עדיין יהיה צורך לבדוק וללחוץ על כפתור השמירה הרגיל.</p>
                <div className="mt-3 flex gap-2"><Button type="button" size="sm" onClick={confirmApply}>כן, העתק</Button><Button type="button" size="sm" variant="ghost" onClick={() => setPendingAction(null)}>ביטול</Button></div>
            </div>}
        </section>
    );
}

function formatAnalysisDate(value) {
    if (!value) return "עכשיו";
    const normalized = Array.isArray(value)
        ? new Date(value[0], (value[1] ?? 1) - 1, value[2] ?? 1, value[3] ?? 0, value[4] ?? 0, value[5] ?? 0)
        : new Date(value);
    return Number.isNaN(normalized.getTime()) ? "עכשיו" : normalized.toLocaleString("he-IL");
}
