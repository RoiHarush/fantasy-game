import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Image from "next/image";

import { cn } from "../../../lib/cn";
import { Button } from "../../../shared/ui/Button";

function ChipConfirmDialog({
    title,
    icon,
    iconAlt = "",
    children,
    notice,
    confirmLabel,
    destructive = false,
    pending = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Dialog.Root open onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm" />
                <Dialog.Content
                    className="fixed inset-x-0 bottom-0 z-[10000] flex max-h-[90dvh] w-full flex-col items-center overflow-y-auto overscroll-contain rounded-t-3xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-6 text-[var(--app-foreground)] shadow-[0_-16px_50px_rgba(0,0,0,0.42)] focus:outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:h-dvh sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-3xl sm:border-y-0 sm:border-r-0 sm:p-10 sm:pt-14 sm:shadow-[-12px_0_40px_rgba(0,0,0,0.42)]"
                >
                    <Dialog.Close asChild>
                        <button
                            type="button"
                            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-foreground)] transition hover:scale-105 hover:bg-[var(--app-accent-surface)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--app-accent-border)]"
                            aria-label={`Close ${title} dialog`}
                        >
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </Dialog.Close>

                    <Image src={icon} alt={iconAlt} width={76} height={76} className="mb-4 size-16 object-contain sm:size-[76px]" />
                    <Dialog.Title className="mb-3 text-center text-2xl font-black sm:text-3xl">
                        {title}
                    </Dialog.Title>

                    <Dialog.Description asChild>
                        <div className="mb-3 text-center text-sm leading-6 text-[var(--app-muted)] sm:text-base">
                            {children}
                        </div>
                    </Dialog.Description>

                    {notice && (
                        <p className="mt-2 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-center text-xs leading-5 text-[var(--app-muted)] sm:text-sm">
                            {notice}
                        </p>
                    )}

                    <div className="mt-6 w-full sm:mt-auto sm:pt-8">
                        <Button
                            type="button"
                            variant={destructive ? "danger" : "primary"}
                            size="lg"
                            className={cn(
                                "w-full rounded-xl font-extrabold",
                                !destructive && "[background:var(--component-gradient)] text-[var(--color-brand-ink)]",
                            )}
                            onClick={onConfirm}
                            disabled={pending}
                        >
                            {pending ? "Saving…" : confirmLabel}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default ChipConfirmDialog;
