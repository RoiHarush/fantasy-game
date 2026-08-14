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
        action: openNotification ? { label: "Open", onClick: openNotification } : undefined,
    });
}
