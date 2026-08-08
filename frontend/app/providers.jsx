"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "../src/Context/AuthContext";
import { WebSocketProvider } from "../src/Context/WebSocketProvider";
import { SystemStatusProvider } from "../src/Context/SystemStatusContext";
import CookieConsentToast from "../src/features/privacy/CookieConsentToast";
import RealtimeTransferSync from "../src/features/transfer-window/RealtimeTransferSync";
import QueryProvider from "../src/lib/query/QueryProvider";

export default function Providers({ children, initialUser, invalidSession, dehydratedState }) {
    return (
        <QueryProvider dehydratedState={dehydratedState}>
            <AuthProvider initialUser={initialUser} invalidSession={invalidSession}>
                <WebSocketProvider>
                    <RealtimeTransferSync />
                    <SystemStatusProvider>{children}</SystemStatusProvider>
                </WebSocketProvider>
                <Toaster position="bottom-center" visibleToasts={3} />
                <CookieConsentToast />
            </AuthProvider>
        </QueryProvider>
    );
}
