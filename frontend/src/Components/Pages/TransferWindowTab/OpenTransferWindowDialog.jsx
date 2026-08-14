"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Play } from "@/src/shared/ui/icons";

import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

export default function OpenTransferWindowDialog({
    open,
    onOpenChange,
    onConfirm,
    pending,
    error,
}) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-1.5rem),27rem)]">
                <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                    <Dialog.Close asChild>
                        <CloseButton className="absolute right-4 top-4" aria-label="Close confirmation" />
                    </Dialog.Close>
                    <span className="grid size-10 place-items-center rounded-xl bg-app-danger-surface text-app-danger-foreground ring-1 ring-app-danger-border sm:size-12 sm:rounded-2xl">
                        <Play aria-hidden="true" size={20} fill="currentColor" />
                    </span>
                    <Dialog.Title className="mt-4 pr-10 text-lg font-black sm:mt-5 sm:text-2xl">
                        Open the window now?
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                        This starts the transfer order immediately. All managers will be notified and the first pick can begin.
                    </Dialog.Description>
                    {error && (
                        <p className="mt-4 border-l-2 border-app-danger-border py-2 pl-3 text-sm text-app-danger-foreground" role="alert">
                            {error.message}
                        </p>
                    )}
                    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
                        <Dialog.Close asChild>
                            <Button variant="secondary">Cancel</Button>
                        </Dialog.Close>
                        <Button variant="danger" onClick={onConfirm} disabled={pending}>
                            {pending ? "Opening…" : "Open window"}
                        </Button>
                    </div>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}
