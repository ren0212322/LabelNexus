"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { StoryClient, StoryConfig, aeneid } from "@story-protocol/core-sdk";
import { custom, createPublicClient, http } from "viem";
import { Loader2, Search, FileSignature, GitFork, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const LICENSE_REGISTRY = "0x529a750E02d8E2f15649c13D69a465286a780e24";

export default function ExplorePage() {
    const { address, client: walletClient } = useWallet();
    const router = useRouter();
    const { toast } = useToast();

    const [ipId, setIpId] = useState("");
    const [licenseTermsId, setLicenseTermsId] = useState("1"); // Default to 1 (usually Non-Commercial)
    const [isFetchingTerms, setIsFetchingTerms] = useState(false);

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

    const handleFetchLicenseTerms = async () => {
        if (!ipId) {
            toast({ title: "Missing IP ID", description: "Please enter an IP Address first.", variant: "destructive" });
            return;
        }

        setIsFetchingTerms(true);
        try {
            const publicClient = createPublicClient({
                chain: aeneid,
                transport: http("https://aeneid.storyrpc.io"),
            });

            console.log("Fetching license terms for:", ipId);

            // Get count of attached license terms
            const count = await publicClient.readContract({
                address: LICENSE_REGISTRY,
                abi: [{
                    name: "getAttachedLicenseTermsCount",
                    type: "function",
                    inputs: [{ name: "ipId", type: "address" }],
                    outputs: [{ type: "uint256" }],
                    stateMutability: "view",
                }],
                functionName: "getAttachedLicenseTermsCount",
                args: [ipId as `0x${string}`],
            }) as bigint;

            console.log(`License terms count: ${count}`);

            if (Number(count) === 0) {
                toast({ title: "No Terms Found", description: "This IP has no attached license terms.", variant: "warning" });
                return;
            }

            // Get all terms
            const terms = [];
            for (let i = 0; i < Number(count); i++) {
                const result = await publicClient.readContract({
                    address: LICENSE_REGISTRY,
                    abi: [{
                        name: "getAttachedLicenseTerms",
                        type: "function",
                        inputs: [
                            { name: "ipId", type: "address" },
                            { name: "index", type: "uint256" },
                        ],
                        outputs: [
                            { name: "licenseTemplate", type: "address" },
                            { name: "licenseTermsId", type: "uint256" },
                        ],
                        stateMutability: "view",
                    }],
                    functionName: "getAttachedLicenseTerms",
                    args: [ipId as `0x${string}`, BigInt(i)],
                }) as [string, bigint];

                console.log(`Term [${i}]: Template ${result[0]}, ID ${result[1]}`);
                terms.push(result[1]);
            }

            if (terms.length > 0) {
                const foundId = terms[0].toString();
                setLicenseTermsId(foundId);
                toast({
                    title: "Terms Found",
                    description: `Found ${terms.length} term(s). Auto-selected ID: ${foundId}`,
                    className: "bg-green-600 text-white"
                });
            }

        } catch (e: any) {
            console.error("Failed to fetch terms:", e);
            toast({ title: "Fetch Failed", description: e.message || "Could not fetch license terms.", variant: "destructive" });
        } finally {
            setIsFetchingTerms(false);
        }
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
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="0x..."
                                        value={ipId}
                                        onChange={(e) => setIpId(e.target.value)}
                                        className="font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleFetchLicenseTerms}
                                        disabled={isFetchingTerms || !ipId}
                                        title="Check for License Terms"
                                    >
                                        {isFetchingTerms ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                    </Button>
                                </div>
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
