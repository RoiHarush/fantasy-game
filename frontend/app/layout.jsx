import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import Providers from "./providers";
import { getCurrentSession } from "../src/server/auth";
import { buildInitialQueryState } from "../src/server/queryPrefetch";

config.autoAddCss = false;

export const metadata = {
    title: {
        default: "Fantasy Draft",
        template: "%s | Fantasy Draft",
    },
    description: "A multi-league fantasy football draft game.",
    icons: {
        icon: [
            { url: "/UI/app-icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/UI/app-icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: "/UI/app-icon-192.png",
        apple: [{ url: "/UI/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        title: "Fantasy",
        statusBarStyle: "default",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f8fbfa" },
        { media: "(prefers-color-scheme: dark)", color: "#0d0815" },
    ],
};

export default async function RootLayout({ children }) {
    const { user: initialUser, invalidSession } = await getCurrentSession();
    const dehydratedState = await buildInitialQueryState(initialUser);

    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <Providers
                    initialUser={initialUser}
                    invalidSession={invalidSession}
                    dehydratedState={dehydratedState}
                >
                    {children}
                </Providers>
            </body>
        </html>
    );
}
