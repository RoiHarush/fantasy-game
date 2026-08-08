import "./globals.css";
import Providers from "./providers";
import { getCurrentSession } from "../src/server/auth";
import { buildInitialQueryState } from "../src/server/queryPrefetch";

export const metadata = {
    title: {
        default: "Fantasy Draft",
        template: "%s | Fantasy Draft",
    },
    description: "A multi-league fantasy football draft game.",
    icons: {
        icon: "/UI/icon.png",
    },
    manifest: "/manifest.json",
};

export default async function RootLayout({ children }) {
    const { user: initialUser, invalidSession } = await getCurrentSession();
    const dehydratedState = await buildInitialQueryState(initialUser);

    return (
        <html lang="en">
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
