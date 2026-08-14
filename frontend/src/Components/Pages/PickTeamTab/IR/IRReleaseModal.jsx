import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw } from "@/src/shared/ui/icons";
import Image from "next/image";

import { Button } from "../../../../shared/ui/Button";
import CloseButton from "../../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../../shared/ui/ResponsiveDialog";
import PlayerKit from "../../../General/PlayerKit";

function IRReleaseModal({ squad, players, irPlayer, onClose, onConfirm }) {
    if (!irPlayer) return null;

    const samePositionPlayers = Object.values(squad.startingLineup)
        .flat()
        .concat(Object.values(squad.bench))
        .map((id) => players.find((player) => String(player.id) === String(id)))
        .filter((player) => (
            player
            && player.position === irPlayer.position
            && String(player.id) !== String(irPlayer.id)
        ));

    function selectOutgoing(player) {
        onConfirm?.(player);
        onClose();
    }

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="flex flex-col sm:w-[min(calc(100vw-2rem),34rem)]">
                <div className="flex max-h-[calc(92dvh-0.375rem)] min-h-0 flex-col">
                    <header className="relative shrink-0 border-b border-app-border bg-app-surface-muted px-5 py-5 pr-16 sm:px-6 sm:py-6 sm:pr-16">
                        <Dialog.Close asChild>
                            <CloseButton className="absolute top-4 right-4" aria-label="Close IR release selection" />
                        </Dialog.Close>
                        <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center">
                                <Image src="/Icons/ir-chip.svg" alt="" width={30} height={30} className="size-7 object-contain" />
                            </span>
                            <div className="min-w-0">
                                <Dialog.Title className="text-lg font-black tracking-tight text-app-foreground sm:text-2xl">Release IR player</Dialog.Title>
                                <Dialog.Description className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">
                                    Choose a {irPlayer.position} to release so {irPlayer.viewName} can return to your squad.
                                </Dialog.Description>
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
                        <div className="mb-3 flex items-center gap-3 border-y border-app-accent-border px-1 py-3 text-app-accent-foreground">
                            <RotateCcw className="size-5 shrink-0" aria-hidden="true" />
                            <p className="min-w-0 text-xs leading-5 sm:text-sm">
                                Returning <strong>{irPlayer.viewName}</strong> from IR
                            </p>
                        </div>

                        {samePositionPlayers.length === 0 ? (
                            <p className="border-y border-dashed border-app-border px-5 py-10 text-center text-sm font-bold text-app-muted">
                                No available players of the same position.
                            </p>
                        ) : (
                            <div className="divide-y divide-app-border border-y border-app-border">
                                {samePositionPlayers.map((player) => (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        key={player.id}
                                        onClick={() => selectOutgoing(player)}
                                        className="flex h-auto min-h-16 w-full min-w-0 items-center gap-3 px-1 py-3 text-left transition hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-red-500 sm:px-2"
                                    >
                                        <PlayerKit
                                            teamId={player.teamId}
                                            type={player.position === "GK" ? "gk" : "field"}
                                            className="h-12 w-9 shrink-0 object-contain"
                                            draggable={false}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate text-sm text-app-foreground">{player.viewName}</strong>
                                            <span className="mt-0.5 block truncate text-[0.68rem] font-bold uppercase tracking-wide text-app-muted">{player.teamName || player.position}</span>
                                        </span>
                                    </Button>
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

export default IRReleaseModal;
