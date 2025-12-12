import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Droplets, Gift, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MEME_TOKEN_ADDRESS, MEME_TOKEN_ABI } from "@/app/constants/memeToken";

export function Navbar() {
    const { address, isConnected } = useAccount();
    const [isClaiming, setIsClaiming] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [isCooldown, setIsCooldown] = useState(false);

    const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

    useEffect(() => {
        // Check local storage on mount
        const lastClaim = localStorage.getItem("meme_claim_last_timestamp");
        if (lastClaim) {
            const timePassed = Date.now() - parseInt(lastClaim);
            if (timePassed < COOLDOWN_PERIOD) {
                setIsCooldown(true);
                updateTimer(parseInt(lastClaim));
            } else {
                setIsCooldown(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isCooldown) return;

        const interval = setInterval(() => {
            const lastClaim = localStorage.getItem("meme_claim_last_timestamp");
            if (lastClaim) {
                updateTimer(parseInt(lastClaim));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isCooldown]);

    const updateTimer = (timestamp: number) => {
        const deadline = timestamp + COOLDOWN_PERIOD;
        const now = Date.now();
        const diff = deadline - now;

        if (diff <= 0) {
            setIsCooldown(false);
            setTimeLeft("");
            return;
        }

        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    const { data: hash, isPending, writeContract } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isSuccess) {
            setIsClaiming(false);
            // Save timestamp
            localStorage.setItem("meme_claim_last_timestamp", Date.now().toString());
            setIsCooldown(true);
        }
    }, [isSuccess]);

    const handleClaim = () => {
        if (!address) return;
        setIsClaiming(true);
        try {
            writeContract({
                address: MEME_TOKEN_ADDRESS as `0x${string}`,
                abi: MEME_TOKEN_ABI,
                functionName: 'mint',
                args: [address, BigInt(100 * 10 ** 18)] // Mint 100 MEME
            });
        } catch (e) {
            console.error(e);
            setIsClaiming(false);
        }
    };

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <span>LabelNexus</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex gap-6 text-sm font-medium">
                    <Link href="/create" className="hover:text-primary transition-colors">Label</Link>
                    <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors">Gallery</Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {isConnected && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden sm:flex gap-2 text-primary hover:text-primary-foreground hover:bg-primary/90"
                            onClick={handleClaim}
                            disabled={isPending || isConfirming || isClaiming || isCooldown}
                        >
                            {isPending || isConfirming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isSuccess ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                                <Gift className="w-4 h-4" />
                            )}
                            {isCooldown ? timeLeft : (isSuccess ? "Claimed!" : "Daily Claim")}
                        </Button>
                    )}

                    <a href="https://cloud.google.com/application/web3/faucet/story/aeneid" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            Faucet
                        </Button>
                    </a>

                    {isConnected && address && (
                        <a href={`https://aeneid.storyscan.io/address/${address}?tab=tokens_nfts`} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" size="sm" className="hidden sm:flex gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Explorer
                            </Button>
                        </a>
                    )}

                    <ConnectButton showBalance={false} />
                </div>

            </div >
        </nav >
    );
}
