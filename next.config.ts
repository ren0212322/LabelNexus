import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "8mb",
        },
        serverComponentsExternalPackages: ["pino", "thread-stream"],
    },
};

export default nextConfig;
