"use client";

import { useState, useEffect } from "react";
import { createWalletClient, custom, Address } from "viem";
import { aeneid } from "@story-protocol/core-sdk";

export function useWallet() {
    const [address, setAddress] = useState<Address | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [client, setClient] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum) {
            // Check if already connected
            window.ethereum.request({ method: "eth_accounts" })
                .then((accounts: any) => {
                    if (accounts && accounts.length > 0) {
                        setAddress(accounts[0]);
                        const walletClient = createWalletClient({
                            chain: aeneid,
                            transport: custom(window.ethereum)
                        });
                        setClient(walletClient);
                    }
                });

            // Listen for checks
            window.ethereum.on('accountsChanged', (accounts: any) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                } else {
                    setAddress(null);
                    setClient(null);
                }
            });
        }
    }, []);

    const connect = async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            alert("Please install Metamask!");
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if (accounts && accounts.length > 0) {
                setAddress(accounts[0]);
                const walletClient = createWalletClient({
                    chain: aeneid,
                    transport: custom(window.ethereum)
                });
                setClient(walletClient);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    };

    return { address, connect, isConnecting, client };
}
