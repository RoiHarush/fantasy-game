"use client";

import { AuthProvider } from "../src/Context/AuthContext";
import { WebSocketProvider } from "../src/Context/WebSocketProvider";
import { SystemStatusProvider } from "../src/Context/SystemStatusContext";
import RealtimeTransferSync from "../src/features/transfer-window/RealtimeTransferSync";
import QueryProvider from "../src/lib/query/QueryProvider";

export default function Providers({ children, initialUser, dehydratedState }) {
    return (
        <QueryProvider dehydratedState={dehydratedState}>
            <AuthProvider initialUser={initialUser}>
                <WebSocketProvider>
                    <RealtimeTransferSync />
                    <SystemStatusProvider>{children}</SystemStatusProvider>
                </WebSocketProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
