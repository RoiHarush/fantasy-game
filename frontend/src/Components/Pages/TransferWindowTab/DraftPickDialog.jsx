import * as Dialog from "@radix-ui/react-dialog";

import { Button } from "../../../shared/ui/Button";

export default function DraftPickDialog({ player, mutation, onClose }) {
    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900 p-7 text-center text-white shadow-2xl focus:outline-none">
                    <Dialog.Title className="text-xl font-bold">Confirm draft pick</Dialog.Title>
                    <Dialog.Description className="mt-3 text-slate-300">
                        Draft <strong className="text-white">{player.viewName}</strong> into your squad?
                    </Dialog.Description>
                    {mutation.error && (
                        <p className="mt-4 text-sm text-red-300" role="alert">
                            {mutation.error.message || "The draft pick could not be completed."}
                        </p>
                    )}
                    <div className="mt-6 flex justify-center gap-3">
                        <Dialog.Close asChild>
                            <Button variant="ghost" disabled={mutation.isPending}>Cancel</Button>
                        </Dialog.Close>
                        <Button
                            onClick={() => mutation.mutate(player.id)}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Saving…" : "Confirm pick"}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
