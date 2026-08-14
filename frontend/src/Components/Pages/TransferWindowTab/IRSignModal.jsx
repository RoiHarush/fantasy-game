import * as Dialog from "@radix-ui/react-dialog";
import { HeartPulse, ShieldPlus } from "@/src/shared/ui/icons";

import { useSignIrPlayer } from "../../../features/transfer-window/useTransferWindow";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";
import PlayerKit from "../../General/PlayerKit";

export default function IRSignModal({ player, user, onClose, previewMode = false }) {
    const signPlayer = useSignIrPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        onSuccess: onClose,
    });

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface>
                <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                    <Dialog.Close asChild>
                        <CloseButton className="absolute right-3 top-3" aria-label="Close IR signing confirmation" />
                    </Dialog.Close>

                    <span className="grid size-9 place-items-center text-rose-600 dark:text-rose-300">
                        <HeartPulse className="size-6" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-muted">Injured Reserve replacement</p>
                    <Dialog.Title className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Confirm IR signing</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-6 text-app-muted">
                        Sign this player as the eligible replacement for your injured squad member.
                    </Dialog.Description>

                    <div className="mt-5 flex items-center gap-3 border-y border-app-border py-3.5">
                        <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className="h-auto w-12 shrink-0 select-none" />
                        <div className="min-w-0 flex-1">
                            <strong className="block truncate text-lg font-black">{player.viewName}</strong>
                            <span className="text-xs font-bold uppercase tracking-wide text-app-muted">
                                {[player.teamShort || player.teamName, player.position].filter(Boolean).join(" · ")}
                            </span>
                        </div>
                        <ShieldPlus className="size-6 shrink-0 text-emerald-500" aria-hidden="true" />
                    </div>

                    <p className="mt-3 border-l-2 border-app-accent-border px-3 py-2 text-xs leading-5 text-app-muted">
                        Position limits and the maximum of three players from one club are validated again by the server.
                    </p>

                    {signPlayer.error && (
                        <p role="alert" className="mt-3 border-l-2 border-red-400 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                            {signPlayer.error.message || "Error signing the IR player."}
                        </p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="border-app-border bg-app-surface text-app-foreground hover:bg-app-surface-muted" disabled={signPlayer.isPending}>Back</Button>
                        </Dialog.Close>
                        <Button
                            onClick={() => previewMode ? onClose() : signPlayer.mutate(player.id)}
                            disabled={signPlayer.isPending}
                        >
                            {signPlayer.isPending ? "Signing…" : previewMode ? "Close preview" : "Confirm signing"}
                        </Button>
                    </div>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}
