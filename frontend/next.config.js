const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.VITE_API_URL ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
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