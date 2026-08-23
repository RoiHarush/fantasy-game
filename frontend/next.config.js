const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");
const webSocketUrl = (
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? `${backendUrl}/ws`
).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactCompiler: true,
    // The browser connects directly to Spring for WebSocket upgrades. Vercel's
    // external rewrite remains appropriate for ordinary REST requests only.
    env: {
        NEXT_PUBLIC_WEBSOCKET_URL: webSocketUrl,
        NEXT_PUBLIC_AI_FEATURES_ENABLED: process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED
            ?? (process.env.NODE_ENV === "production" ? "false" : "true"),
    },
    allowedDevOrigins: [
        '192.168.1.181',
        '192.168.68.69',
        '*.trycloudflare.com',
    ],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "resources.premierleague.com",
                pathname: "/premierleague25/photos/players/**",
            },
            {
                protocol: "https",
                hostname: "resources.premierleague.com",
                pathname: "/premierleague/badges/**",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${backendUrl}/api/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/sw.js",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
                    { key: "Service-Worker-Allowed", value: "/" },
                ],
            },
            {
                source: "/manifest.json",
                headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
            },
        ];
    },
};

export default nextConfig;
