import * as Dialog from "@radix-ui/react-dialog";
import { ShieldPlus } from "@/src/shared/ui/icons";
import Image from "next/image";

import { Button } from "../../../../shared/ui/Button";
import CloseButton from "../../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../../shared/ui/ResponsiveDialog";
import PlayerKit from "../../../General/PlayerKit";
import { getIrPlayerUnavailableReason } from "../../../../features/pick-team/model";

function IRModal({ squad, players, firstPickCaptainActive = false, onClose, onSelect }) {
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
                            <CloseButton className="absolute top-4 right-4" aria-label="Close IR player selection" />
                        </Dialog.Close>
                        <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center">
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
                            <div className="border-y border-dashed border-app-border px-5 py-10 text-center">
                                <ShieldPlus className="mx-auto size-7 text-app-muted" aria-hidden="true" />
                                <p className="mt-3 text-sm font-bold text-app-muted">No players are available for IR.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-app-border border-y border-app-border">
                                {eligiblePlayers.map((player) => {
                                    const unavailableReason = getIrPlayerUnavailableReason({
                                        playerId: player.id,
                                        firstPickId: squad.firstPickId,
                                        firstPickCaptainActive,
                                    });

                                    return (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            key={player.id}
                                            onClick={() => onSelect(player)}
                                            disabled={Boolean(unavailableReason)}
                                            title={unavailableReason || `Move ${player.viewName} to IR`}
                                            className="flex h-auto min-h-16 w-full min-w-0 items-center gap-3 px-1 py-3 text-left transition hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-app-accent disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent sm:px-2"
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
                                            {unavailableReason && (
                                                <span className="mt-1 block text-xs font-semibold leading-4 text-amber-700 dark:text-amber-300">
                                                    {unavailableReason}
                                                </span>
                                            )}
                                        </span>
                                        </Button>
                                    );
                                })}
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
