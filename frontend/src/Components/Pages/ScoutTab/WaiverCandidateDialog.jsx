"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { useState } from "react";

import { useMediaQuery } from "../../../hooks/useMediaQuery";
import PlayerKit from "../../General/PlayerKit";

export default function WaiverCandidateDialog({
    candidate,
    eligibleOutgoing,
    entries,
    onChange,
    saving,
    onClose,
}) {
    const [playerOutId, setPlayerOutId] = useState("");
    const isMobile = useMediaQuery("(max-width: 767px)");

    async function addPriority() {
        if (!playerOutId) return;
        const entry = { playerInId: candidate.id, playerOutId: Number(playerOutId) };
        const alreadyPlanned = entries.some(
            (item) => String(item.playerInId) === String(entry.playerInId)
                && String(item.playerOutId) === String(entry.playerOutId),
        );
        if (!alreadyPlanned) await onChange([...entries, entry]);
        onClose();
    }

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[5000] bg-[#08030f]/75 backdrop-blur-sm" />
                <Dialog.Content
                    className="fixed top-1/2 left-1/2 z-[5001] flex w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none sm:w-[calc(100%-2rem)]"
                    style={isMobile
                        ? { height: "min(30rem, calc(100vh - 1rem))", maxHeight: "calc(100vh - 1rem)" }
                        : { maxHeight: "90vh" }}
                >
                    <header className="relative shrink-0 border-b border-app-border bg-component-gradient px-4 py-3 text-brand-ink sm:px-6 sm:py-5">
                        <Dialog.Title className="pr-10 text-base font-extrabold sm:pr-12 sm:text-xl">Add waiver</Dialog.Title>
                        <Dialog.Description className="mt-0.5 pr-9 text-[0.75rem] font-semibold text-brand-ink/70 sm:mt-1 sm:pr-10 sm:text-sm">
                            Choose the {candidate.position} player leaving your squad.
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button type="button" className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-lg border border-white/40 bg-white/35 transition hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-brand-ink sm:top-4 sm:right-4 sm:size-10" aria-label="Close waiver dialog">
                                <X aria-hidden="true" size={17} />
                            </button>
                        </Dialog.Close>
                    </header>

                    <div className="min-h-0 overflow-y-auto p-3 sm:p-6">
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

                        <fieldset className="mt-3 sm:mt-5">
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
                        </fieldset>
                    </div>

                    <footer className="flex shrink-0 gap-2 border-t border-app-border bg-app-surface px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                        <Dialog.Close asChild>
                            <button type="button" className="h-9 flex-1 whitespace-nowrap rounded-control border border-app-border bg-app-surface-muted px-3 text-xs font-bold text-app-foreground transition hover:bg-app-accent-hover sm:h-11 sm:flex-none sm:px-4 sm:text-sm">Cancel</button>
                        </Dialog.Close>
                        <button type="button" className="h-9 flex-1 whitespace-nowrap rounded-control bg-component-gradient px-3 text-xs font-extrabold text-brand-ink shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:flex-none sm:px-5 sm:text-sm" disabled={!playerOutId || saving} onClick={addPriority}>
                            {saving ? "Saving..." : "Add waiver"}
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
