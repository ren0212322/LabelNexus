import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    serverExternalPackages: ["pino", "thread-stream"],
    experimental: {
        serverActions: {
            bodySizeLimit: "8mb",
        },
    },
};

export default nextConfig;
