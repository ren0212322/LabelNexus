"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { custom } from "viem";
import { Loader2, Search, FileSignature, GitFork } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function ExplorePage() {
    const { address, client: walletClient } = useWallet();
    const router = useRouter();
    const { toast } = useToast();

    const [ipId, setIpId] = useState("");
    const [licenseTermsId, setLicenseTermsId] = useState("1"); // Default to 1 (usually Non-Commercial)

    // Mint License State
    const [isMinting, setIsMinting] = useState(false);
    const [mintAmount, setMintAmount] = useState("1");

    const getClient = () => {
        if (!walletClient || !address) return null;
        return StoryClient.newClient({
            account: address,
            transport: custom(window.ethereum),
            chainId: "aeneid",
        });
    };

    const handleMintLicense = async () => {
        const client = getClient();
        if (!client || !address) {
            toast({ title: "Wallet not connected", description: "Please connect your wallet.", variant: "destructive" });
            return;
        }

        if (!ipId) {
            toast({ title: "Missing IP ID", description: "Please enter an IP Asset ID.", variant: "destructive" });
            return;
        }

        setIsMinting(true);
        try {
            const response = await client.license.mintLicenseTokens({
                licensorIpId: ipId as `0x${string}`,
                licenseTermsId: licenseTermsId,
                amount: parseInt(mintAmount),
                receiver: address,
                maxMintingFee: BigInt(0), // Simplified for MVP
                maxRevenueShare: 100 // Simplified for MVP
            });

            toast({
                title: "License Minted!",
                description: `Token IDs: ${response.licenseTokenIds?.join(", ")}`,
                className: "bg-green-600 text-white"
            });
            console.log("Minted License:", response);

        } catch (e: any) {
            console.error(e);
            toast({ title: "Mint Failed", description: e.message || "Unknown error", variant: "destructive" });
        } finally {
            setIsMinting(false);
        }
    };

    const handleRemix = () => {
        if (!ipId) {
            toast({ title: "Missing IP ID", description: "Please enter an IP Asset ID to remix.", variant: "destructive" });
            return;
        }
        // Redirect to Create page with parent IP ID and Terms ID
        router.push(`/create?parentIpId=${ipId}&parentLicenseTermsId=${licenseTermsId}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto py-12 max-w-2xl">
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
                            Explore & License
                        </h1>
                        <p className="text-muted-foreground">
                            Interact with existing IP Assets on Story Protocol.
                        </p>
                    </div>

                    <Card className="bg-card border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Find IP Asset
                            </CardTitle>
                            <CardDescription>
                                Enter the IP Asset ID (address) you want to use.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>IP Asset ID</Label>
                                <Input
                                    placeholder="0x..."
                                    value={ipId}
                                    onChange={(e) => setIpId(e.target.value)}
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>License Terms ID</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 1"
                                    value={licenseTermsId}
                                    onChange={(e) => setLicenseTermsId(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    ID of the terms you want to invoke (Default: 1 for Non-Commercial).
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Action 1: Mint License */}
                        <Card className="border-cyan-900/50 bg-cyan-950/10 hover:border-cyan-500/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-cyan-400">
                                    <FileSignature className="w-5 h-5" />
                                    Mint License
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        value={mintAmount}
                                        onChange={(e) => setMintAmount(e.target.value)}
                                        min="1"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                                    onClick={handleMintLicense}
                                    disabled={isMinting || !ipId}
                                >
                                    {isMinting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Mint License Token
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Action 2: Remix */}
                        <Card className="border-violet-900/50 bg-violet-950/10 hover:border-violet-500/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-violet-400">
                                    <GitFork className="w-5 h-5" />
                                    Remix / Derivative
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground min-h-[70px]">
                                    Create a new dataset derived from this IP. You will be redirected to the labeling studio.
                                </p>
                                <Button
                                    className="w-full bg-violet-600 hover:bg-violet-700"
                                    onClick={handleRemix}
                                    disabled={!ipId}
                                >
                                    Create Derivative
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
