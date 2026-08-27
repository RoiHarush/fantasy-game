"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Cropper from "react-easy-crop";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Minus, Plus } from "@/src/shared/ui/icons";

import { createCroppedTeamLogo } from "../../../features/team-profile/cropImage";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

function TeamLogoCropDialog({ source, fileName, onCancel, onComplete }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropPixels, setCropPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    async function applyCrop() {
        if (!cropPixels) return;

        setProcessing(true);
        try {
            const croppedLogo = await createCroppedTeamLogo(source, cropPixels, fileName);
            await onComplete(croppedLogo);
        } catch (error) {
            toast.error(error.message || "Unable to crop this image");
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Dialog.Root open={Boolean(source)} onOpenChange={(open) => !open && onCancel()}>
            <ResponsiveDialogSurface className="flex max-h-[92dvh] flex-col sm:w-[min(calc(100vw-2rem),38rem)]">
                <header className="relative bg-component-gradient px-5 pb-4 pt-7 text-brand-ink sm:px-7 sm:py-6">
                    <Dialog.Close asChild>
                        <CloseButton className="absolute right-4 top-4" aria-label="Close image editor" />
                    </Dialog.Close>
                    <Dialog.Title className="pr-12 text-xl font-black sm:text-2xl">Position your team image</Dialog.Title>
                    <Dialog.Description className="mt-1 max-w-lg text-sm font-semibold opacity-75">
                        Drag to choose what remains visible, then zoom until the frame looks right.
                    </Dialog.Description>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="relative mx-auto aspect-square w-full max-w-[28rem] overflow-hidden rounded-2xl border border-app-border bg-slate-950 shadow-inner">
                        {source && (
                            <Cropper
                                image={source}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="rect"
                                showGrid
                                objectFit="cover"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, pixels) => setCropPixels(pixels)}
                            />
                        )}
                    </div>

                    <div className="mx-auto mt-5 flex w-full max-w-[28rem] items-center gap-3">
                        <Minus className="size-4 shrink-0 text-app-muted" aria-hidden="true" />
                        <label htmlFor="team-logo-zoom" className="sr-only">Image zoom</label>
                        <input
                            id="team-logo-zoom"
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(event) => setZoom(Number(event.target.value))}
                            className="h-2 min-w-0 flex-1 cursor-pointer accent-brand-purple"
                        />
                        <Plus className="size-4 shrink-0 text-app-muted" aria-hidden="true" />
                    </div>
                </div>

                <footer className="grid grid-cols-2 gap-3 border-t border-app-border bg-app-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={processing}>Choose another</Button>
                    <Button type="button" onClick={applyCrop} disabled={processing || !cropPixels}>
                        <ImagePlus className="size-4" aria-hidden="true" />
                        {processing ? "Preparing…" : "Use image"}
                    </Button>
                </footer>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

export default TeamLogoCropDialog;
