import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRightLeft, Crown, Info, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/cn";
import CloseButton from "../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../shared/ui/ResponsiveDialog";

function PlayerActionModal({
    player,
    squad,
    onClose,
    onSwitch,
    onSetCaptain,
    onSetVice,
    onViewInfo,
    isCaptain,
    isVice,
    canBeCaptain,
    firstPickUsed
}) {
    if (!player) return null;

    const isLockedFirstPickCaptain =
        firstPickUsed && String(squad?.firstPickId) === String(player.id);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 sm:w-[min(calc(100vw-2rem),27.5rem)] sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-app-border pb-4">
                    <div>
                        <span className="mb-1 block text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-app-accent-foreground">Player actions</span>
                        <Dialog.Title className="text-xl font-extrabold leading-tight text-app-foreground sm:text-2xl">
                            {`${player.firstName} ${player.lastName}`}
                        </Dialog.Title>
                    </div>
                    <Dialog.Close asChild>
                        <CloseButton aria-label="Close player actions" />
                    </Dialog.Close>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        type="button"
                        className={cn(ACTION_BUTTON, isLockedFirstPickCaptain && "cursor-not-allowed opacity-45")}
                        onClick={() => onSwitch(player.id)}
                        disabled={isLockedFirstPickCaptain}
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-component-gradient text-brand-ink"><ArrowRightLeft aria-hidden="true" size={20} /></span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <strong className="text-sm font-extrabold">Switch player</strong>
                            <small className="text-xs text-app-muted">Choose a valid squad replacement</small>
                        </span>
                    </button>

                    <div className="grid grid-cols-2 gap-2.5">
                        <label className={cn(ROLE_OPTION, isCaptain && ROLE_SELECTED, (!canBeCaptain || firstPickUsed) && "cursor-not-allowed opacity-45")}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isCaptain}
                                onChange={() => onSetCaptain(player.id)}
                                disabled={!canBeCaptain || firstPickUsed}
                            />
                            <Crown aria-hidden="true" size={20} />
                            <span className="flex min-w-0 flex-col">
                                <strong className="text-sm font-extrabold">Captain</strong>
                                <small className="text-[0.7rem] text-app-muted">Double points</small>
                            </span>
                        </label>

                        <label className={cn(ROLE_OPTION, isVice && ROLE_SELECTED, !canBeCaptain && "cursor-not-allowed opacity-45")}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isVice}
                                onChange={() => onSetVice(player.id)}
                                disabled={!canBeCaptain}
                            />
                            <ShieldCheck aria-hidden="true" size={20} />
                            <span className="flex min-w-0 flex-col">
                                <strong className="text-sm font-extrabold">Vice</strong>
                                <small className="text-[0.7rem] text-app-muted">Captain backup</small>
                            </span>
                        </label>
                    </div>

                    <button type="button" className={`${ACTION_BUTTON} justify-center font-extrabold text-app-accent-foreground`} onClick={() => onViewInfo(player)}>
                        <Info aria-hidden="true" size={20} />
                        <span>View player information</span>
                    </button>

                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

const ACTION_BUTTON = "flex w-full items-center gap-3 rounded-xl border border-app-border bg-app-surface-muted px-3.5 py-3 text-left text-app-foreground transition hover:-translate-y-px hover:border-app-accent-border hover:bg-app-accent-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent-border disabled:cursor-not-allowed disabled:opacity-45";
const ROLE_OPTION = "relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-app-border bg-app-surface p-3 text-app-muted transition hover:border-app-accent-border hover:bg-app-accent-surface hover:text-app-accent-foreground focus-within:ring-2 focus-within:ring-app-accent-border";
const ROLE_SELECTED = "border-app-accent bg-app-accent-surface text-app-accent-foreground ring-1 ring-app-accent";

export default PlayerActionModal;
