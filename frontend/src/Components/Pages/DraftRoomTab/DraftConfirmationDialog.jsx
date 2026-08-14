import * as Dialog from "@radix-ui/react-dialog";
import { Play, Trash2 } from "@/src/shared/ui/icons";

import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

export default function DraftConfirmationDialog({ pendingAction, onOpenChange, onConfirm, isPending, supplementalDraft }) {
    const isOpening = pendingAction === "open";

    return (
        <Dialog.Root open={Boolean(pendingAction)} onOpenChange={onOpenChange}>
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-1.5rem),27rem)]">
                <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                    <Dialog.Close asChild>
                        <CloseButton className="absolute top-4 right-4" aria-label="Close confirmation" />
                    </Dialog.Close>
                    <span className={`grid size-10 place-items-center rounded-xl ring-1 sm:size-12 sm:rounded-2xl ${isOpening ? "bg-app-positive-surface text-app-positive-foreground ring-app-positive-border" : "bg-app-danger-surface text-app-danger-foreground ring-app-danger-border"}`}>
                        {isOpening ? <Play aria-hidden="true" size={20} fill="currentColor" /> : <Trash2 aria-hidden="true" size={20} />}
                    </span>
                    <Dialog.Title className="mt-4 pr-10 text-lg font-black sm:mt-5 sm:text-2xl">
                        {isOpening ? "Open the draft now?" : "Cancel the scheduled draft?"}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                        {isOpening
                            ? supplementalDraft
                                ? "This starts the two-round supplemental draft immediately for every league manager."
                                : "This starts the initial snake draft immediately for every league manager."
                            : "The current date and countdown will be removed for every league manager."}
                    </Dialog.Description>
                    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="border-app-border bg-app-surface-muted text-app-foreground" disabled={isPending}>Back</Button>
                        </Dialog.Close>
                        <Button variant={isOpening ? "success" : "danger"} onClick={onConfirm} disabled={isPending}>
                            {isPending ? "Saving…" : "Confirm"}
                        </Button>
                    </div>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}
