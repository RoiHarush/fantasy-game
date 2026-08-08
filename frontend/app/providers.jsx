"use client";

import { ThemeProvider } from "next-themes";

import { AuthProvider } from "../src/Context/AuthContext";
import { WebSocketProvider } from "../src/Context/WebSocketProvider";
import { SystemStatusProvider } from "../src/Context/SystemStatusContext";
import CookieConsentToast from "../src/features/privacy/CookieConsentToast";
import RealtimeTransferSync from "../src/features/transfer-window/RealtimeTransferSync";
import QueryProvider from "../src/lib/query/QueryProvider";
import AppToaster from "../src/Components/Theme/AppToaster";

export default function Providers({ children, initialUser, invalidSession, dehydratedState }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme
            disableTransitionOnChange
        >
            <QueryProvider dehydratedState={dehydratedState}>
                <AuthProvider initialUser={initialUser} invalidSession={invalidSession}>
                    <WebSocketProvider>
                        <RealtimeTransferSync />
                        <SystemStatusProvider>{children}</SystemStatusProvider>
                    </WebSocketProvider>
                    <AppToaster />
                    <CookieConsentToast />
                </AuthProvider>
            </QueryProvider>
        </ThemeProvider>
    );
}
