import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";

import { cn } from "../../../lib/cn";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

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
            <ResponsiveDialogSurface
                desktopVariant="drawer"
                className="flex flex-col items-center overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:p-10 sm:pt-14"
            >
                    <Dialog.Close asChild>
                        <CloseButton className="absolute top-4 right-4" aria-label={`Close ${title} dialog`} />
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
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

export default ChipConfirmDialog;
