"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Plus } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { StoryClient, StoryConfig, PILFlavor, aeneid } from "@story-protocol/core-sdk";
import { custom, http } from "viem";
import { uploadToPinata, uploadJSONToPinata } from "@/app/actions/story"; // Only importing upload helpers!

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    prompt: string;
}

export function RegistrationModal({ isOpen, onClose, imageUrl, prompt }: RegistrationModalProps) {
    const { address, client: walletClient } = useWallet();
    const [storyClient, setStoryClient] = useState<StoryClient | null>(null);

    // Form State
    const [collectionAddress, setCollectionAddress] = useState("");
    const [savedCollections, setSavedCollections] = useState<Array<{ name: string, address: string }>>([]);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [licenseType, setLicenseType] = useState("non-commercial"); // 'non-commercial', 'commercial'

    const [status, setStatus] = useState<"idle" | "uploading" | "minting" | "success" | "error">("idle");
    const [txHash, setTxHash] = useState("");
    const [explorerUrl, setExplorerUrl] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Initialize Story Client
    useEffect(() => {
        if (walletClient && address) {
            const config: StoryConfig = {
                account: address,
                transport: custom(window.ethereum),
                chainId: "aeneid",
            };
            const client = StoryClient.newClient(config);
            setStoryClient(client);
        }
    }, [walletClient, address]);

    // Load Collections & Auto-fill
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("memeStory_collections") || "[]");
        setSavedCollections(stored);
        if (stored.length > 0) setCollectionAddress(stored[0].address);

        if (prompt) {
            setTitle(prompt.slice(0, 50));
            setDescription(`Meme generated from prompt: ${prompt}`);
        }
    }, [isOpen, prompt]);

    const handleCreateCollection = async () => {
        if (!storyClient || !newCollectionName) return;

        // Network Check (Simple enforce)
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x523' }], // 1315 (Aeneid) in Hex is 0x523
            });
        } catch (e) {
            console.warn("Switch chain failed or rejected", e);
        }

        const prevText = newCollectionName;
        setNewCollectionName("Creating...");

        try {
            const newCollection = await storyClient.nftClient.createNFTCollection({
                name: prevText,
                symbol: "MEME",
                isPublicMinting: true,
                mintOpen: true,
                contractURI: "ipfs://QmTeLVjM6Ney29mgCh75BWATC6hsxiyGKnbkUM3K1ZNNja",
                mintFeeRecipient: '0x0000000000000000000000000000000000000000'
            });

            const newEntry = { name: prevText, address: newCollection.spgNftContract! };
            const updated = [...savedCollections, newEntry];
            setSavedCollections(updated);
            localStorage.setItem("memeStory_collections", JSON.stringify(updated));
            setCollectionAddress(newCollection.spgNftContract!);
            setNewCollectionName("");
            setIsCreatingCollection(false);
        } catch (e: any) {
            console.error(e);
            alert("Error creating collection: " + e.message);
            setNewCollectionName(prevText);
        }
    };

    const handleMintAndRegister = async () => {
        if (!storyClient || !collectionAddress) {
            alert("Please connect wallet and select a collection.");
            return;
        }
        setStatus("uploading");
        setErrorMessage("");

        try {
            // 1. Upload Image
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
            // Note: server action expects string or Buffer handled internally. 
            // In story.ts we have uploadToPinata taking (content: string | Buffer).
            // We'll pass the base64 string directly if the action supports it, or buffer?
            // Since we can't easily pass Node Buffer from client, we'll pass base64 string.
            // Assumption: `uploadToPinata` in actions/story.ts handles base64 string properly or we need to update it?
            // Previous code used `imageUrl`, let's try passing the dataURL directly, or just the base64.
            // The action likely converts it. For now, passing `imageUrl` (Data URI) is safest if action handles it.
            const ipfsImageUrl = await uploadToPinata(imageUrl, "meme.png");

            // 2. Upload Metadata
            const ipMetadata = {
                title,
                description,
                image: ipfsImageUrl,
                mediaUrl: ipfsImageUrl,
                mediaType: "image/png",
                creators: [{ name: "MemeStory Artist", address }]
            };
            const ipMetadataURI = await uploadJSONToPinata(ipMetadata);

            const nftMetadata = {
                name: title,
                description,
                image: ipfsImageUrl
            };
            const nftMetadataURI = await uploadJSONToPinata(nftMetadata);

            setStatus("minting");

            // 3. Register with Story Protocol
            let licenseTerms;
            if (licenseType === 'commercial') {
                licenseTerms = PILFlavor.commercialRemix({
                    commercialRevShare: 10, // 10%
                    defaultMintingFee: 0n,
                    currency: '0x1514000000000000000000000000000000000000' // Mock WIP
                });
            } else {
                licenseTerms = PILFlavor.nonCommercialSocialRemix();
            }

            const txResponse = await storyClient.ipAsset.registerIpAsset({
                nft: { type: 'mint', spgNftContract: collectionAddress as `0x${string}` },
                licenseTermsData: [{ terms: licenseTerms }],
                ipMetadata: {
                    ipMetadataURI,
                    ipMetadataHash: `0x${'0'.repeat(64)}`,
                    nftMetadataURI,
                    nftMetadataHash: `0x${'0'.repeat(64)}`
                }
            });

            if (txResponse.txHash) {
                setTxHash(txResponse.txHash);
                setExplorerUrl(`https://aeneid.explorer.story.foundation/ipa/${txResponse.ipId}`);
                setStatus("success");
            } else {
                throw new Error("No TX Hash returned");
            }

        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || "An error occurred");
            setStatus("error");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-2 border-yellow-400/20 shadow-xl bg-background">
                <DialogHeader>
                    <DialogTitle>Register IP Asset</DialogTitle>
                </DialogHeader>

                {status === "success" ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <h3 className="font-bold text-xl">Successfully Minted!</h3>
                        <p className="text-muted-foreground">Your meme is now on Story Protocol.</p>
                        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">
                            View on Explorer
                        </a>
                        <Button onClick={onClose} className="w-full mt-4">Done</Button>
                    </div>
                ) : (
                    <div className="space-y-5">

                        {/* 1. Collection */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-yellow-500 font-bold">Select SPG NFT Collection</Label>
                            </div>

                            {!isCreatingCollection ? (
                                <div className="flex gap-2">
                                    <Select value={collectionAddress} onValueChange={setCollectionAddress}>
                                        <SelectTrigger className="w-full font-mono text-xs">
                                            <SelectValue placeholder="Select a collection..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {savedCollections.map(c => (
                                                <SelectItem key={c.address} value={c.address}>
                                                    {c.name} ({c.address.slice(0, 6)}...)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" variant="outline" onClick={() => setIsCreatingCollection(true)}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                                    <Input
                                        placeholder="New Collection Name"
                                        className="h-9 text-xs"
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleCreateCollection} disabled={!newCollectionName}>
                                        Create
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsCreatingCollection(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* 2. Metadata */}
                        <div className="space-y-2">
                            <Label className="text-yellow-500 font-bold">Title (for IP & NFT Metadata)</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grumpy Cat Remix" />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your meme..." />
                        </div>

                        {/* 3. License */}
                        <div className="space-y-2">
                            <Label className="text-yellow-500 font-bold">License Type</Label>
                            <Select value={licenseType} onValueChange={setLicenseType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="non-commercial">Non-Commercial Social Remix</SelectItem>
                                    <SelectItem value="commercial">Commercial Remix (10% RevShare)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Error */}
                        {errorMessage && (
                            <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        {/* Button */}
                        <Button
                            onClick={handleMintAndRegister}
                            disabled={status === "uploading" || status === "minting" || !collectionAddress}
                            className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400"
                        >
                            {status === "uploading" && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading to IPFS...</>}
                            {status === "minting" && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming in Wallet...</>}
                            {status === "idle" && "Mint & Register"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
