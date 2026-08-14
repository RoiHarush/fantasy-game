import * as Dialog from "@radix-ui/react-dialog";
import { Trash2 } from "@/src/shared/ui/icons";

import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

export default function RemoveManagerDialog({ manager, onOpenChange, onConfirm, pending = false }) {
    return (
        <Dialog.Root open={Boolean(manager)} onOpenChange={onOpenChange}>
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-1.5rem),27rem)]">
                <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                    <Dialog.Close asChild>
                        <CloseButton className="absolute top-3 right-3" aria-label="Close confirmation" />
                    </Dialog.Close>
                    <span className="grid size-11 place-items-center rounded-xl bg-app-danger-surface text-app-danger-foreground ring-1 ring-app-danger-border">
                        <Trash2 className="size-5" aria-hidden="true" />
                    </span>
                    <Dialog.Title className="mt-4 text-xl font-black">Remove manager?</Dialog.Title>
                    <Dialog.Description className="mt-2 pr-3 text-sm leading-6 text-app-muted">
                        {manager?.name} will lose access to this league. This action is available only before the initial draft.
                    </Dialog.Description>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <Dialog.Close asChild>
                            <Button variant="secondary" disabled={pending}>Cancel</Button>
                        </Dialog.Close>
                        <Button variant="danger" onClick={onConfirm} disabled={pending}>
                            {pending ? "Removing…" : "Remove"}
                        </Button>
                    </div>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}
