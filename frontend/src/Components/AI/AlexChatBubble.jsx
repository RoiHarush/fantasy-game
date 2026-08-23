import { useEffect, useRef } from "react";
import { Bot, X } from "@/src/shared/ui/icons";
import { Button } from "../../shared/ui/Button";

export default function AlexChatBubble({ open, onOpenChange, messages, question, onQuestionChange, onSubmit, busy, remaining }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    return (
        <>
            <Button
                type="button"
                size="icon"
                className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-60 size-14 rounded-full border-2 border-white/40 bg-component-gradient text-brand-ink shadow-[0_10px_30px_rgba(55,0,60,0.35)] md:right-6 md:bottom-6"
                aria-label={open ? "סגור שיחה עם Alex" : "פתח שיחה עם Alex"}
                aria-expanded={open}
                onClick={() => onOpenChange(!open)}
            >
                {open ? <X className="size-5" aria-hidden="true" /> : <Bot className="size-6" aria-hidden="true" />}
            </Button>

            {open && (
                <section role="dialog" aria-label="שיחה עם Alex" dir="rtl" className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+9.75rem)] z-50 flex max-h-[min(34rem,70vh)] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-brand-purple/35 bg-app-surface text-app-foreground shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:right-6 md:bottom-24">
                    <header className="flex items-center gap-3 bg-component-gradient px-4 py-3 text-brand-ink">
                        <span className="grid size-9 place-items-center rounded-full bg-white/45"><Bot className="size-5" aria-hidden="true" /></span>
                        <div>
                            <h3 className="font-black">Alex · עוזר המאמן</h3>
                            <p className="text-[0.68rem] font-semibold opacity-80">שאל על ההרכב או על ההעברות שהוצעו</p>
                        </div>
                    </header>

                    <div className="flex min-h-36 flex-1 flex-col gap-2 overflow-y-auto bg-app-background/45 p-3">
                        {messages?.length ? messages.map((message, index) => (
                            <p key={`${message.createdAt}-${index}`} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${message.role === "user" ? "self-start rounded-br-sm bg-brand-purple text-white" : "self-end rounded-bl-sm border border-app-border bg-app-surface"}`}>
                                {message.content}
                            </p>
                        )) : (
                            <p className="m-auto max-w-[15rem] text-center text-sm text-app-muted">אחרי הניתוח אפשר לשאול כאן למה Alex בחר בשחקן מסוים.</p>
                        )}
                    </div>

                    <form className="border-t border-app-border bg-app-surface p-3" onSubmit={onSubmit}>
                        <div className="flex gap-2">
                            <input ref={inputRef} className="min-w-0 flex-1 rounded-control border border-app-border bg-app-background px-3 py-2 text-sm" value={question} maxLength={500} onChange={(event) => onQuestionChange(event.target.value)} placeholder="שאל את Alex…" />
                            <Button type="submit" size="sm" disabled={busy || !question.trim()}>שלח</Button>
                        </div>
                        <p className="mt-2 text-[0.68rem] text-app-muted">נותרו {remaining ?? 0} שאלות המשך במחזור</p>
                    </form>
                </section>
            )}
        </>
    );
}
