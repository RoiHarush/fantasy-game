import * as Dialog from "@radix-ui/react-dialog";
import { ShieldPlus, X } from "lucide-react";
import Image from "next/image";

import { Button } from "../../../../shared/ui/Button";
import { ResponsiveDialogSurface } from "../../../../shared/ui/ResponsiveDialog";
import PlayerKit from "../../../General/PlayerKit";

function IRModal({ squad, players, onClose, onSelect }) {
    const eligiblePlayers = Object.values(squad.startingLineup)
        .flat()
        .concat(Object.values(squad.bench))
        .map((id) => players.find((player) => String(player.id) === String(id)))
        .filter(Boolean)
        .filter((player, index, values) => (
            values.findIndex((candidate) => String(candidate.id) === String(player.id)) === index
        ));

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="flex flex-col sm:w-[min(calc(100vw-2rem),34rem)]">
                <div className="flex max-h-[calc(92dvh-0.375rem)] min-h-0 flex-col">
                    <header className="relative shrink-0 border-b border-app-border bg-app-surface-muted px-5 py-5 pr-16 sm:px-6 sm:py-6 sm:pr-16">
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-app-muted hover:bg-app-accent-hover hover:text-app-foreground" aria-label="Close IR player selection">
                                <X className="size-5" aria-hidden="true" />
                            </Button>
                        </Dialog.Close>
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-app-accent-border bg-app-accent-surface">
                                <Image src="/Icons/ir-chip.svg" alt="" width={30} height={30} className="size-7 object-contain" />
                            </span>
                            <div className="min-w-0">
                                <Dialog.Title className="text-lg font-black tracking-tight text-app-foreground sm:text-2xl">Select player for IR</Dialog.Title>
                                <Dialog.Description className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">
                                    Choose the squad player who will move into your IR slot.
                                </Dialog.Description>
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
                        {eligiblePlayers.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-5 py-10 text-center">
                                <ShieldPlus className="mx-auto size-7 text-app-muted" aria-hidden="true" />
                                <p className="mt-3 text-sm font-bold text-app-muted">No players are available for IR.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                                {eligiblePlayers.map((player) => (
                                    <button
                                        type="button"
                                        key={player.id}
                                        onClick={() => onSelect(player)}
                                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-app-border bg-app-surface px-3 py-3 text-left transition hover:border-app-accent-border hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-app-accent"
                                    >
                                        <PlayerKit
                                            teamId={player.teamId}
                                            type={player.position === "GK" ? "gk" : "field"}
                                            className="h-12 w-9 shrink-0 object-contain"
                                            draggable={false}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate text-sm text-app-foreground">{player.viewName}</strong>
                                            <span className="mt-0.5 block text-[0.68rem] font-bold uppercase tracking-wide text-app-muted">{player.position}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <footer className="shrink-0 border-t border-app-border bg-app-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="w-full border-app-border bg-app-surface-muted text-app-foreground hover:bg-app-accent-hover">Cancel</Button>
                        </Dialog.Close>
                    </footer>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

export default IRModal;
