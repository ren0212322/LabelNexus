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

import { defineChain } from "viem";

// Define Story Aeneid Chain
const storyAeneid = defineChain({
    id: 1315,
    name: "Story Aeneid",
    nativeCurrency: {
        decimals: 18,
        name: "IP",
        symbol: "IP",
    },
    rpcUrls: {
        default: { http: ["https://aeneid.storyrpc.io"] },
    },
    blockExplorers: {
        default: { name: "Story Explorer", url: "https://aeneid.storyscan.xyz" },
    },
    testnet: true,
    batch: {
        multicall: false
    }
});

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
    appName: "LabelHuman",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3fcc6bba6f1d54709235a8efcf6a4ecc", // Fallback for build
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
