"use client";

import { toast } from "sonner";

export function showNotificationToast(event, { onOpen } = {}) {
    if (!event?.title) return;

    const openNotification = event.url
        ? () => {
            if (onOpen) {
                onOpen(event);
                return;
            }
            window.location.assign(event.url);
        }
        : undefined;

    toast(event.title, {
        id: event.eventId,
        description: event.body,
        position: "top-center",
        className: "app-toast--notification",
        duration: 6_500,
        action: openNotification ? { label: "Open", onClick: openNotification } : undefined,
    });
}
