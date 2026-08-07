import "../src/Styles/Reset.css";
import Providers from "./providers";

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

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
