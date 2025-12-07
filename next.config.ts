import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "8mb",
        },
    },
    webpack: (config) => {
        config.externals.push("pino", "thread-stream");
        return config;
    },
};

export default nextConfig;
