"use client";

import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

const APP_RESUME_RECOVERY_AFTER_MS = 5_000;

export function AppResumeRecovery({ queryClient }) {
    const hiddenAtRef = useRef(null);
    const recoveryPromiseRef = useRef(null);

    useEffect(() => {
        const recoverActiveQueries = () => {
            if (document.visibilityState !== "visible" || recoveryPromiseRef.current) return;

            const hiddenAt = hiddenAtRef.current;
            hiddenAtRef.current = null;
            if (hiddenAt == null || Date.now() - hiddenAt < APP_RESUME_RECOVERY_AFTER_MS) return;

            // iOS can freeze an in-flight request together with the PWA. Abort
            // that request, but only refetch active data whose staleTime has
            // actually elapsed. Fresh player snapshots should not be downloaded
            // again after every short app switch.
            recoveryPromiseRef.current = queryClient.cancelQueries(
                { type: "active", stale: true },
                { silent: true },
            ).then(() => queryClient.refetchQueries({
                type: "active",
                stale: true,
            })).finally(() => {
                recoveryPromiseRef.current = null;
            });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                hiddenAtRef.current = Date.now();
                return;
            }
            recoverActiveQueries();
        };

        const handlePageShow = (event) => {
            if (event.persisted && hiddenAtRef.current == null) {
                hiddenAtRef.current = 0;
            }
            recoverActiveQueries();
        };

        const handleOnline = () => {
            if (hiddenAtRef.current == null) hiddenAtRef.current = 0;
            recoverActiveQueries();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("online", handleOnline);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("online", handleOnline);
        };
    }, [queryClient]);

    return null;
}

export default function QueryProvider({ children, dehydratedState }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                retry: (failureCount, error) => {
                    if (failureCount >= 1) return false;
                    return !error?.status || error.status >= 500;
                },
            },
            mutations: {
                retry: 0,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AppResumeRecovery queryClient={queryClient} />
            <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
        </QueryClientProvider>
    );
}
