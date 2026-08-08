"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

function subscribe() {
    return () => {};
}

export default function AppToaster() {
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    const { resolvedTheme } = useTheme();

    return (
        <Toaster
            position="bottom-center"
            visibleToasts={3}
            theme={mounted ? resolvedTheme : "system"}
        />
    );
}
