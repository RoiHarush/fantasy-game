"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeftRight, Check } from "lucide-react";
import { useState } from "react";

import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";
import CloseButton from "../../../shared/ui/CloseButton";
import PlayerKit from "../../General/PlayerKit";

export default function WaiverCandidateDialog({
    candidate,
    eligibleOutgoing,
    entries,
    onChange,
    irPlayer,
    irEntries = [],
    onIrChange,
    saving,
    onClose,
}) {
    const [playerOutId, setPlayerOutId] = useState("");
    const [planType, setPlanType] = useState("REGULAR");
    const canAddToIr = Boolean(
        irPlayer
        && onIrChange
        && candidate.position === irPlayer.position,
    );

    async function addPriority() {
        if (planType === "IR") {
            if (!canAddToIr) return;
            await onIrChange([...irEntries, {
                playerInId: candidate.id,
                playerOutId: irPlayer.id,
            }]);
            onClose();
            return;
        }
        if (!playerOutId) return;
        const entry = { playerInId: candidate.id, playerOutId: Number(playerOutId) };
        await onChange([...entries, entry]);
        onClose();
    }

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="flex flex-col sm:w-[min(calc(100vw-2rem),32rem)]">
                    <header className="relative shrink-0 border-b border-app-border bg-component-gradient px-4 py-3 text-brand-ink sm:px-6 sm:py-5">
                        <Dialog.Title className="pr-10 text-base font-extrabold sm:pr-12 sm:text-xl">
                            {planType === "IR" ? "Add IR priority" : "Add waiver"}
                        </Dialog.Title>
                        <Dialog.Description className="mt-0.5 pr-9 text-[0.75rem] font-semibold text-brand-ink/70 sm:mt-1 sm:pr-10 sm:text-sm">
                            {planType === "IR"
                                ? `Prepare a ${candidate.position} replacement for your IR slot.`
                                : `Choose the ${candidate.position} player leaving your squad.`}
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <CloseButton className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4" aria-label="Close waiver dialog" />
                        </Dialog.Close>
                    </header>

                    <div className="min-h-0 overflow-y-auto p-3 sm:p-6">
                        {canAddToIr && (
                            <div className="mb-3 grid grid-cols-2 rounded-control border border-app-border bg-app-surface-muted p-1 sm:mb-5">
                                {[
                                    ["REGULAR", "Transfer waiver"],
                                    ["IR", "IR replacement"],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`rounded-lg px-2 py-2 text-xs font-extrabold transition sm:text-sm ${planType === value
                                            ? "bg-app-surface-elevated text-app-accent-foreground shadow-sm"
                                            : "text-app-muted hover:text-app-foreground"
                                        }`}
                                        onClick={() => setPlanType(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-2 sm:gap-3 sm:p-3">
                            <PlayerKit
                                teamId={candidate.teamId}
                                type={candidate.position === "GK" ? "gk" : "field"}
                                className="block shrink-0 object-contain"
                                style={{ width: "1.8rem", height: "1.8rem", maxWidth: "1.8rem", maxHeight: "1.8rem" }}
                            />
                            <div className="min-w-0">
                                <span className="text-[0.58rem] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 sm:text-[0.65rem]">Incoming</span>
                                <p className="truncate text-[0.82rem] font-extrabold text-app-foreground sm:text-base">{candidate.viewName}</p>
                                <p className="text-[0.64rem] text-app-muted sm:text-xs">{candidate.position}</p>
                            </div>
                            <ArrowLeftRight aria-hidden="true" className="ml-auto text-app-muted" size={21} />
                        </div>

                        {planType === "REGULAR" ? <fieldset className="mt-3 sm:mt-5">
                            <legend className="mb-1.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-app-muted sm:mb-2 sm:text-xs">Outgoing player</legend>
                            <div className="grid gap-2">
                                {eligibleOutgoing.map((player) => {
                                    const selected = String(playerOutId) === String(player.id);
                                    return (
                                        <label key={player.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 transition sm:gap-3 sm:p-3 ${selected ? "border-app-accent bg-app-accent-surface shadow-sm" : "border-app-border bg-app-surface hover:border-app-accent-border hover:bg-app-accent-hover"}`}>
                                            <input
                                                type="radio"
                                                name="outgoing-player"
                                                value={player.id}
                                                checked={selected}
                                                onChange={(event) => setPlayerOutId(event.target.value)}
                                                className="sr-only"
                                            />
                                            <PlayerKit
                                                teamId={player.teamId}
                                                type={player.position === "GK" ? "gk" : "field"}
                                                className="block shrink-0 object-contain"
                                                style={{ width: "1.7rem", height: "1.7rem", maxWidth: "1.7rem", maxHeight: "1.7rem" }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[0.78rem] font-extrabold text-app-foreground sm:text-sm">{player.viewName}</p>
                                                <p className="text-[0.63rem] text-app-muted sm:text-xs">{player.teamShort || "Squad player"} • {player.position}</p>
                                            </div>
                                            <span className={`grid size-7 place-items-center rounded-full border ${selected ? "border-app-accent bg-app-accent text-white" : "border-app-border text-transparent"}`}>
                                                <Check aria-hidden="true" size={15} strokeWidth={3} />
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {eligibleOutgoing.length === 0 && (
                                <p className="rounded-xl border border-dashed border-app-border bg-app-surface-muted p-5 text-center text-sm text-app-muted">
                                    Your squad has no eligible {candidate.position} replacement.
                                </p>
                            )}
                        </fieldset> : (
                            <div className="mt-3 rounded-xl border border-app-accent-border bg-app-accent-surface p-3 text-xs text-app-accent-foreground sm:mt-5 sm:text-sm">
                                If every saved IR priority is unavailable, the server signs the highest-scoring legal {candidate.position} automatically.
                            </div>
                        )}
                    </div>

                    <footer className="flex shrink-0 gap-2 border-t border-app-border bg-app-surface px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                        <Dialog.Close asChild>
                            <button type="button" className="h-9 flex-1 whitespace-nowrap rounded-control border border-app-border bg-app-surface-muted px-3 text-xs font-bold text-app-foreground transition hover:bg-app-accent-hover sm:h-11 sm:flex-none sm:px-4 sm:text-sm">Cancel</button>
                        </Dialog.Close>
                        <button type="button" className="h-9 flex-1 whitespace-nowrap rounded-control bg-component-gradient px-3 text-xs font-extrabold text-brand-ink shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:flex-none sm:px-5 sm:text-sm" disabled={(planType === "REGULAR" && !playerOutId) || saving} onClick={addPriority}>
                            {saving ? "Saving..." : planType === "IR" ? "Add IR priority" : "Add waiver"}
                        </button>
                    </footer>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}
