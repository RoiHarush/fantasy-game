"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { cn } from "../../lib/cn";

const DISMISS_DISTANCE = 112;
const DISMISS_VELOCITY = 0.55;

function shouldDismissSheetDrag(offset, elapsed) {
    const safeElapsed = Math.max(elapsed, 1);
    return offset >= DISMISS_DISTANCE || offset / safeElapsed >= DISMISS_VELOCITY;
}

function ResponsiveDialogSurface({ children, className, style, ...props }) {
    const contentRef = useRef(null);
    const closeButtonRef = useRef(null);
    const dragRef = useRef(null);
    const dragOffsetRef = useRef(0);
    const closeTimerRef = useRef(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
        }
    }, []);

    const finishDrag = (event, cancelled = false) => {
        const drag = dragRef.current;
        if (!drag) return;

        const elapsed = performance.now() - drag.startedAt;
        const currentOffset = dragOffsetRef.current;
        const shouldDismiss = !cancelled
            && shouldDismissSheetDrag(currentOffset, elapsed);

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        dragRef.current = null;
        setIsDragging(false);

        if (shouldDismiss) {
            const contentHeight = contentRef.current?.getBoundingClientRect().height ?? window.innerHeight;
            dragOffsetRef.current = contentHeight;
            setDragOffset(contentHeight);
            closeTimerRef.current = window.setTimeout(() => closeButtonRef.current?.click(), 180);
            return;
        }

        dragOffsetRef.current = 0;
        setDragOffset(0);
    };

    const handlePointerDown = (event) => {
        if (event.button !== 0 || window.matchMedia("(min-width: 640px)").matches) return;

        dragRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startedAt: performance.now(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;

        const nextOffset = Math.max(0, event.clientY - drag.startY);
        dragOffsetRef.current = nextOffset;
        setDragOffset(nextOffset);
    };

    return (
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[5000] bg-slate-950/75 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
            <Dialog.Content
                ref={contentRef}
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[5001] max-h-[min(92dvh,52rem)] overflow-hidden rounded-t-[2rem] border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(calc(100vw-2rem),32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]",
                    className,
                )}
                style={{
                    ...style,
                    translate: `0 ${dragOffset}px`,
                    transition: isDragging ? "none" : "translate 180ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                {...props}
            >
                <div className="h-1.5 bg-component-gradient" aria-hidden="true" />
                <button
                    type="button"
                    aria-label="Drag down to close"
                    className="flex h-9 w-full touch-none cursor-grab items-center justify-center active:cursor-grabbing sm:hidden"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => finishDrag(event)}
                    onPointerCancel={(event) => finishDrag(event, true)}
                >
                    <span className="h-1.5 w-12 rounded-full bg-app-muted/55" aria-hidden="true" />
                </button>
                {children}
                <Dialog.Close ref={closeButtonRef} className="sr-only" tabIndex={-1} aria-hidden="true">
                    Close
                </Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    );
}

export { ResponsiveDialogSurface, shouldDismissSheetDrag };
