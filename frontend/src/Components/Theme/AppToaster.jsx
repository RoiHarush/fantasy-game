"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { toast, Toaster } from "sonner";

import { API_RATE_LIMIT_EVENT } from "../../lib/apiEvents";

function subscribe() {
    return () => {};
}

export default function AppToaster() {
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const showRateLimitToast = (event) => {
            const retryAfterSeconds = event.detail?.retryAfterSeconds;
            toast.error("Easy there, manager", {
                id: "api-rate-limited",
                description: retryAfterSeconds
                    ? `That was a lot of requests. Try again in ${retryAfterSeconds} seconds.`
                    : "That was a lot of requests. Give it a moment and try again.",
                position: "top-center",
                duration: 5_500,
            });
        };

        window.addEventListener(API_RATE_LIMIT_EVENT, showRateLimitToast);
        return () => window.removeEventListener(API_RATE_LIMIT_EVENT, showRateLimitToast);
    }, []);

    return (
        <Toaster
            position="bottom-center"
            visibleToasts={3}
            theme={mounted ? resolvedTheme : "system"}
            richColors
            toastOptions={{
                classNames: {
                    toast: "app-toast",
                    success: "app-toast--success",
                    error: "app-toast--error",
                    info: "app-toast--notification",
                },
            }}
        />
    );
}
