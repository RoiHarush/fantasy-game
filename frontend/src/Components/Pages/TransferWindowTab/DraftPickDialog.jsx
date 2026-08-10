import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, Sparkles, X } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";
import PlayerKit from "../../General/PlayerKit";

export default function DraftPickDialog({ player, mutation, onClose }) {
    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface>
                <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                    <Dialog.Close asChild>
                        <Button variant="ghost" size="icon" className="absolute right-3 top-3 text-app-muted hover:bg-app-surface-muted hover:text-app-foreground" aria-label="Close draft confirmation">
                            <X aria-hidden="true" />
                        </Button>
                    </Dialog.Close>

                    <span className="grid size-12 place-items-center rounded-2xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                        <Sparkles className="size-6" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-muted">Your draft turn</p>
                    <Dialog.Title className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Confirm your selection</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-6 text-app-muted">
                        This player will be added to your squad when the pick is confirmed.
                    </Dialog.Description>

                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-app-accent-border bg-app-accent-surface p-3.5">
                        <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className="h-auto w-12 shrink-0 select-none" />
                        <div className="min-w-0 flex-1">
                            <strong className="block truncate text-lg font-black text-app-foreground">{player.viewName}</strong>
                            <span className="text-xs font-bold uppercase tracking-wide text-app-muted">
                                {[player.teamShort || player.teamName, player.position].filter(Boolean).join(" · ")}
                            </span>
                        </div>
                        <ShieldCheck className="size-6 shrink-0 text-emerald-500" aria-hidden="true" />
                    </div>

                    {mutation.error && (
                        <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-300" role="alert">
                            {mutation.error.message || "The draft pick could not be completed."}
                        </p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="border-app-border bg-app-surface text-app-foreground hover:bg-app-surface-muted" disabled={mutation.isPending}>Back</Button>
                        </Dialog.Close>
                        <Button onClick={() => mutation.mutate(player.id)} disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving…" : "Confirm pick"}
                        </Button>
                    </div>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}
