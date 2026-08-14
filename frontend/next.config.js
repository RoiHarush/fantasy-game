const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactCompiler: true,
    allowedDevOrigins: [
        '192.168.1.181',
        '192.168.68.69',
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
            {
                source: "/ws/:path*",
                destination: `${backendUrl}/ws/:path*`,
            },
            {
                source: "/ws",
                destination: `${backendUrl}/ws`,
            },
        ];
    },
};

export default nextConfig;
