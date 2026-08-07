const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactCompiler: true,
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
