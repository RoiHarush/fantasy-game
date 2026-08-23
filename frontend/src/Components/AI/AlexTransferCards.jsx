import { ArrowLeft } from "@/src/shared/ui/icons";
import PlayerKit from "../General/PlayerKit";
import { Button } from "../../shared/ui/Button";

export default function AlexTransferCards({ transfers, playersById, onSelect }) {
    if (!transfers?.length) {
        return <p className="rounded-xl border border-dashed border-app-border p-4 text-sm text-app-muted">Alex לא מצא כרגע שדרוג ברור וחוקי לסגל.</p>;
    }

    return (
        <div className="grid gap-3">
            {transfers.map((transfer, index) => {
                const outgoing = playersById.get(String(transfer.playerOutId));
                const incoming = playersById.get(String(transfer.playerInId));
                return (
                    <article key={`${transfer.playerOutId}-${transfer.playerInId}`} className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated shadow-sm">
                        <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-stretch">
                            <TransferPlayer player={outgoing} fallbackName={transfer.playerOutName} position={transfer.position} tone="out" label="יוצא" />
                            <div className="grid place-items-center bg-app-surface-muted text-app-muted">
                                <span className="grid size-8 place-items-center rounded-full border border-app-border bg-app-surface shadow-sm">
                                    <ArrowLeft className="size-4 text-app-positive-foreground" aria-hidden="true" />
                                </span>
                            </div>
                            <TransferPlayer player={incoming} fallbackName={transfer.playerInName} position={transfer.position} tone="in" label="נכנס" />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-3 py-3 sm:px-4">
                            <div className="min-w-0">
                                <p className="text-sm text-app-foreground"><strong>שדרוג משוער: +{transfer.improvement}</strong></p>
                                <p className="mt-0.5 text-xs text-app-muted">{transfer.reason}</p>
                                <p className="mt-0.5 text-[0.68rem] font-bold text-app-accent-foreground">סיכוי לפי סדר החלון: {transfer.orderConfidence}</p>
                            </div>
                            {onSelect && <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(transfer)}>הוסף לתכנית · {index + 1}</Button>}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function TransferPlayer({ player, fallbackName, position, tone, label }) {
    return (
        <div className={`relative flex min-w-0 items-center gap-2 p-3 sm:p-4 ${tone === "in" ? "bg-emerald-500/8" : "bg-rose-500/8"}`}>
            <span className={`absolute top-2 right-2 text-[0.6rem] font-black tracking-wider uppercase ${tone === "in" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{label}</span>
            <PlayerKit
                teamId={player?.teamId ?? 0}
                type={(player?.position ?? position) === "GK" ? "gk" : "field"}
                className="mt-2 h-auto w-10 shrink-0 object-contain drop-shadow sm:w-12"
                draggable={false}
            />
            <div className="mt-2 min-w-0">
                <p className="truncate text-xs font-black text-app-foreground sm:text-sm" dir="ltr">{player?.viewName ?? fallbackName}</p>
                <p className="text-[0.65rem] font-bold text-app-muted">{player?.position ?? position}</p>
            </div>
        </div>
    );
}
