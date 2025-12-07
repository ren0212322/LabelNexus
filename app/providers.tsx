"use client";

import * as React from "react";
import {
    RainbowKitProvider,
    getDefaultWallets,
    getDefaultConfig,
    darkTheme,
} from "@rainbow-me/rainbowkit";
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import {
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
    mainnet,
    sepolia,
} from "wagmi/chains";

// Define Story Aeneid Chain
const storyAeneid = {
    id: 1315,
    name: "Story Aeneid",
    network: "story-aeneid",
    nativeCurrency: {
        decimals: 18,
        name: "IP",
        symbol: "IP",
    },
    rpcUrls: {
        default: { http: ["https://aeneid.storyrpc.io"] },
        public: { http: ["https://aeneid.storyrpc.io"] },
    },
    blockExplorers: {
        default: { name: "Story Explorer", url: "https://aeneid.storyscan.xyz" },
    },
    testnet: true,
};

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
    appName: "MemeStory",
    projectId: "YOUR_PROJECT_ID", // TODO: User should replace this eventually, or we leave generic
    wallets: [
        ...wallets,
        {
            groupName: "Other",
            wallets: [argentWallet, trustWallet, ledgerWallet],
        },
    ],
    chains: [
        storyAeneid,
        mainnet,
        sepolia,
    ],
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#7b3fe4',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}
                    initialChain={storyAeneid}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
