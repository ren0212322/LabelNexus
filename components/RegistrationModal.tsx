"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Plus, Wand2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { StoryClient, StoryConfig, PILFlavor, WIP_TOKEN_ADDRESS, LicenseTerms } from "@story-protocol/core-sdk";
import { custom, parseEther } from "viem";
import { uploadToPinata, uploadJSONToPinata } from "@/app/actions/story";
import { generateMemeDescription } from "@/app/actions/gemini";
import { toast } from "sonner";

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    prompt: string;
    parentIpId?: string;
    parentLicenseTermsId?: string;
    labels?: any[];
}

export function RegistrationModal({ isOpen, onClose, imageUrl, prompt, parentIpId, parentLicenseTermsId, labels }: RegistrationModalProps) {
    const { address, client: walletClient } = useWallet();
    const [storyClient, setStoryClient] = useState<StoryClient | null>(null);

    // Form State
    const [collectionAddress, setCollectionAddress] = useState("");
    const [savedCollections, setSavedCollections] = useState<Array<{ name: string, address: string }>>([]);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");

    const [title, setTitle] = useState("");
    const [creatorName, setCreatorName] = useState("");
    const [description, setDescription] = useState("");
    const [licenseType, setLicenseType] = useState("non-commercial");
    const [revShare, setRevShare] = useState("10");
    console.log("RegistrationModal State - revShare:", revShare);

    const [status, setStatus] = useState<"idle" | "uploading" | "minting" | "success" | "error">("idle");
    const [txHash, setTxHash] = useState("");
    const [explorerUrl, setExplorerUrl] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // New State for Description Generation
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

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
        const stored = JSON.parse(localStorage.getItem("labelHuman_collections") || "[]");
        setSavedCollections(stored);
        if (stored.length > 0) setCollectionAddress(stored[0].address);

        if (prompt) {
            setTitle(prompt.slice(0, 50));
            // Only auto-fill if not already describing something custom
            if (!description) setDescription(`Dataset with ${labels?.length || 0} labels. Source prompt: ${prompt}`);
        } else if (labels && labels.length > 0) {
            if (!description) setDescription(`Labeled dataset containing ${labels.length} points.`);
        }
    }, [isOpen, prompt]);

    const handleCreateCollection = async () => {
        if (!storyClient || !newCollectionName) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x523' }],
            });
        } catch (e) {
            console.warn("Switch chain failed or rejected", e);
        }

        const prevText = newCollectionName;
        setNewCollectionName("Creating...");

        try {
            const newCollection = await storyClient.nftClient.createNFTCollection({
                name: prevText,
                symbol: "LNX",
                isPublicMinting: true,
                mintOpen: true,
                contractURI: "ipfs://QmTeLVjM6Ney29mgCh75BWATC6hsxiyGKnbkUM3K1ZNNja",
                mintFeeRecipient: '0x0000000000000000000000000000000000000000'
            });

            const newEntry = { name: prevText, address: newCollection.spgNftContract! };
            const updated = [...savedCollections, newEntry];
            setSavedCollections(updated);
            localStorage.setItem("labelHuman_collections", JSON.stringify(updated));
            setCollectionAddress(newCollection.spgNftContract!);
            setNewCollectionName("");
            setIsCreatingCollection(false);
        } catch (e: any) {
            console.error(e);
            alert("Error creating collection: " + e.message);
            setNewCollectionName(prevText);
        }
    };

    const handleAutoGenerateDescription = async () => {
        if (!imageUrl) return;
        setIsGeneratingDesc(true);
        try {
            const result = await generateMemeDescription(imageUrl);
            if (result.success && result.description) {
                setDescription(result.description);
            } else {
                alert(result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate description");
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    // Remix Logic Placeholder
    useEffect(() => {
        if (parentIpId) {
            console.log("Remixing from IP:", parentIpId);
        }
    }, [parentIpId]);


    const handleMintAndRegister = async () => {
        if (!storyClient || !collectionAddress) {
            alert("Please connect wallet and select a collection.");
            return;
        }
        setStatus("uploading");
        setErrorMessage("");

        try {
            const ipfsImageUrl = await uploadToPinata(imageUrl, "meme.png");

            const ipMetadata = {
                title,
                description,
                image: ipfsImageUrl,
                mediaUrl: ipfsImageUrl,
                mediaType: "image/png",
                creators: [{ name: creatorName || "LabelHuman User", address }],
                attributes: [
                    ...(labels ? [{ trait_type: "Label Count", value: labels.length }, { trait_type: "Labels", value: JSON.stringify(labels) }] : [])
                ]
            };
            const ipMetadataURI = await uploadJSONToPinata(ipMetadata);

            const nftMetadata = {
                name: title,
                description,
                image: ipfsImageUrl
            };
            const nftMetadataURI = await uploadJSONToPinata(nftMetadata);

            setStatus("minting");

            let licenseTerms;
            if (licenseType === 'commercial') {
                const share = parseInt(revShare);
                if (isNaN(share) || share < 0 || share > 100) {
                    throw new Error("Revenue share must be between 0 and 100");
                }

                licenseTerms = PILFlavor.commercialRemix({
                    commercialRevShare: share,
                    defaultMintingFee: BigInt(0),
                    currency: WIP_TOKEN_ADDRESS
                });
            } else {
                licenseTerms = PILFlavor.nonCommercialSocialRemixing();
            }

            console.log("=== REGISTRATION DATA DEBUG ===");
            console.log("Collection Address:", collectionAddress);
            console.log("Title:", title);
            console.log("Description:", description);
            console.log("License Type:", licenseType);
            console.log("Rev Share:", revShare);
            console.log("License Terms Object:", JSON.stringify(licenseTerms, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value // Handle BigInt serialization
                , 2));
            console.log("IP Metadata:", ipMetadata);
            console.log("NFT Metadata:", nftMetadata);
            console.log("Parent IP ID:", parentIpId);
            console.log("Parent License Terms ID:", parentLicenseTermsId);
            console.log("===============================");

            let txResponse;

            if (parentIpId && parentLicenseTermsId) {
                // Register as Derivative
                console.log("Action: Registering Derivative IP...");
                txResponse = await storyClient.ipAsset.registerDerivativeIpAsset({
                    nft: { type: 'mint', spgNftContract: collectionAddress as `0x${string}` },
                    derivData: {
                        parentIpIds: [parentIpId as `0x${string}`],
                        licenseTermsIds: [parentLicenseTermsId]
                    },
                    ipMetadata: {
                        ipMetadataURI,
                        ipMetadataHash: `0x${'0'.repeat(64)}`,
                        nftMetadataURI,
                        nftMetadataHash: `0x${'0'.repeat(64)}`
                    }
                });
            } else {
                // Regular Registration
                console.log("Action: Registering New IP...");
                txResponse = await storyClient.ipAsset.registerIpAsset({
                    nft: { type: 'mint', spgNftContract: collectionAddress as `0x${string}` },
                    licenseTermsData: [{ terms: licenseTerms }],
                    ipMetadata: {
                        ipMetadataURI,
                        ipMetadataHash: `0x${'0'.repeat(64)}`,
                        nftMetadataURI,
                        nftMetadataHash: `0x${'0'.repeat(64)}`
                    }
                });
            }

            if (!txResponse) {
                throw new Error("Transaction failed: No response from SDK");
            }

            if (txResponse.txHash) {
                setTxHash(txResponse.txHash);
                console.log("=====================IP ID:", txResponse.ipId);
                console.log(`License Terms ID: ${txResponse.licenseTermsIds}`);

                setExplorerUrl(`https://aeneid.explorer.story.foundation/ipa/${txResponse.ipId}`);
                setStatus("success");
            } else {
                throw new Error("No TX Hash returned");
            }

        } catch (e: any) {
            console.error(e);
            const msg = e.message || "An error occurred";
            setErrorMessage(msg);
            toast.error(msg);
            setStatus("error");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-2 border-yellow-400/20 shadow-xl bg-background">
                <DialogHeader>
                    <DialogTitle>
                        {parentIpId ? "Remix & Register Derivative" : "Register Labeled Dataset"}
                    </DialogTitle>
                </DialogHeader>

                {status === "success" ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <h3 className="font-bold text-xl">Successfully Registered!</h3>
                        <p className="text-muted-foreground">Your dataset is now on Story Protocol.</p>
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
                                <Label className="text-primary font-bold">Select Dataset Collection</Label>
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
                            <Label className="text-primary font-bold">Title</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Faces Dataset v1" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Description</Label>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs text-purple-600 hover:text-purple-700 from-purple-100 to-white"
                                    onClick={handleAutoGenerateDescription}
                                    disabled={isGeneratingDesc}
                                >
                                    {isGeneratingDesc ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                    AI Generate
                                </Button>
                            </div>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your dataset..." />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary font-bold">Creator Name</Label>
                            <Input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="Enter your name or alias" />
                        </div>

                        {!parentIpId && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-primary font-bold">License Type</Label>
                                    <Select value={licenseType} onValueChange={setLicenseType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="non-commercial">Non-Commercial Social Remix</SelectItem>
                                            <SelectItem value="commercial">Commercial Remix</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {licenseType === 'commercial' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-primary font-bold">Commercial Revenue Share (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={revShare}
                                                onChange={(e) => setRevShare(e.target.value)}
                                                placeholder="e.g. 10"
                                            />
                                            <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Percentage of revenue you claim from remixes.</p>
                                    </div>
                                )}
                            </div>
                        )}

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
                            className="w-full bg-primary text-white font-bold hover:bg-primary/90"
                        >
                            {status === "uploading" && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading to IPFS...</>}
                            {status === "minting" && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming in Wallet...</>}
                            {status === "idle" && (parentIpId ? "Register Derivative" : "Mint & Register Dataset")}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
