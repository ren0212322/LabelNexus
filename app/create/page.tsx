"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Loader2, Save, Type, ScanFace } from "lucide-react";
import { RegistrationModal } from "@/components/RegistrationModal";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dynamically import Canvas to avoid SSR issues with Konva
const LabelCanvas = dynamic(() => import("@/components/LabelCanvas").then(mod => mod.LabelCanvas), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg"><Loader2 className="animate-spin text-purple-500" /></div>
});

export default function CreatePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateContent />
        </Suspense>
    );
}

function CreateContent() {
    const { isConnected } = useAccount();
    const [imageUrl, setImageUrl] = useState<string>("");

    // Labeling State
    const [labels, setLabels] = useState<Array<{ id: string, x: number, y: number, label: string }>>([]);
    const [pendingLabel, setPendingLabel] = useState<{ x: number, y: number } | null>(null);
    const [labelInput, setLabelInput] = useState("");
    const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);

    // Registration Modal
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [imageToRegister, setImageToRegister] = useState("");

    const stageRef = useRef<any>(null);
    const { toast } = useToast();

    // Handlers
    const handleAddLabelStart = (x: number, y: number) => {
        setPendingLabel({ x, y });
        setLabelInput("");
        setIsLabelDialogOpen(true);
    };

    const confirmLabel = () => {
        if (!pendingLabel || !labelInput) return;

        const newLabel = {
            id: Date.now().toString(),
            x: pendingLabel.x,
            y: pendingLabel.y,
            label: labelInput
        };

        setLabels([...labels, newLabel]);
        setIsLabelDialogOpen(false);
        setPendingLabel(null);
    };

    const removeLabel = (id: string) => {
        setLabels(labels.filter(l => l.id !== id));
    };

    const handleExport = () => {
        if (stageRef.current) {
            const uri = stageRef.current.toDataURL();
            const link = document.createElement('a');
            link.download = 'label-human-dataset.png';
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const searchParams = useSearchParams();
    const parentIpId = searchParams.get('parentIpId');
    const parentLicenseTermsId = searchParams.get('parentLicenseTermsId');

    // Fetch Parent IP Image if remixing
    useEffect(() => {
        if (parentIpId) {
            const fetchParentIP = async () => {
                try {
                    toast({ title: "Loading Parent IP...", description: "Fetching original image for remix." });
                    console.log("Fetching Remix ID:", parentIpId);
                    const response = await fetch("https://staging-api.storyprotocol.net/api/v4/assets", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-API-Key": process.env.NEXT_PUBLIC_STORY_API_KEY || "KOTbaGUSWQ6cUJWhiJYiOjPgB0kTRu1eCFFvQL0IWls"
                        },
                        body: JSON.stringify({
                            where: {
                                ipIds: [parentIpId]
                            }
                        })
                    });

                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        const ipAsset = data.data[0];

                        let fetchedUrl: string | undefined = undefined;

                        // Helper to safely get string
                        const getUrl = (item: any) => typeof item === 'string' ? item : item?.originalUrl || item?.cachedUrl || item?.pngUrl;

                        if (ipAsset.nftMetadata) {
                            fetchedUrl = getUrl(ipAsset.nftMetadata.image);
                            if (!fetchedUrl && ipAsset.nftMetadata.raw?.metadata?.image) {
                                fetchedUrl = ipAsset.nftMetadata.raw.metadata.image;
                            }
                        }

                        if (!fetchedUrl) {
                            fetchedUrl = ipAsset.ipMetadata?.image || ipAsset.ipMetadata?.mediaUrl;
                        }

                        console.log("Resolved Image URL:", fetchedUrl);

                        if (fetchedUrl) {
                            // Ensure it's a string
                            let displayUrl = String(fetchedUrl);

                            // Convert IPFS to HTTP
                            if (displayUrl.startsWith("ipfs://")) {
                                displayUrl = displayUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                            }
                            setImageUrl(displayUrl);
                            toast({ title: "Image Loaded", description: "Parent IP image loaded successfully." });
                        } else {
                            toast({ title: "No Image Found", description: "Could not find image in IP metadata.", variant: "destructive" });
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch parent IP", e);
                    toast({ title: "Load Failed", description: "Could not fetch parent IP data.", variant: "destructive" });
                }
            };
            fetchParentIP();
        }
    }, [parentIpId]);

    const handleOpenRegister = () => {
        if (!isConnected) {
            toast({ title: "Wallet not connected", description: "Please connect wallet to register IP.", variant: "destructive" });
            return;
        }

        if (!imageUrl) {
            toast({ title: "No image", description: "Please upload an image first.", variant: "destructive" });
            return;
        }

        // Ideally we register the ORIGINAL image, but for visualization we might want the labels.
        // Standard practice for labeling is: Image + Sidecar JSON.
        // Here we'll register the Image URL (as is) and pass labels in metadata.

        // If we want to snapshot the View with labels, we use stageRef.
        // Let's use the original image for clean data, and labels as metadata.
        setImageToRegister(imageUrl);
        setIsRegisterModalOpen(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 container py-6 grid md:grid-cols-[350px_1fr] gap-6 grid-cols-1">

                {/* Left Panel: Tools */}
                <div className="space-y-6">

                    {/* Step 1: Upload */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Upload className="w-5 h-5" />
                                1. Upload Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Upload an image containing people or objects to label.
                            </p>
                            <div className="grid w-full items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="w-full border-dashed border-2 h-24 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-muted-foreground" />
                                        <span>Click to Upload</span>
                                    </div>
                                </Button>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                if (ev.target?.result) setImageUrl(ev.target.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: Instructions */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <ScanFace className="w-5 h-5" />
                                2. Labeling
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>Click anywhere on the image to add a point label.</p>
                            <p>Examples: "Face", "Hand", "Car", "Tree".</p>
                            <div className="pt-2 flex items-center justify-between">
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">Labels: {labels.length}</span>
                                <Button variant="ghost" size="sm" onClick={() => setLabels([])} className="h-6 text-xs text-red-400 hover:text-red-300">Clear All</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 3: Registration */}
                    <Card className="border-purple-500/30 bg-purple-500/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-400">
                                <Save className="w-5 h-5" />
                                3. Register IP
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Mint your dataset and register it on Story Protocol.
                            </p>
                            {isConnected ? (
                                <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg" onClick={handleOpenRegister}>
                                    Register Dataset
                                </Button>
                            ) : (
                                <ConnectButton />
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Right Panel: Canvas */}
                <div className="bg-card border border-border rounded-xl flex items-center justify-center min-h-[500px] relative overflow-hidden h-auto aspect-video md:h-[700px] shadow-2xl shadow-black/50">
                    {imageUrl ? (
                        <LabelCanvas
                            imageUrl={imageUrl}
                            labels={labels}
                            onAddLabel={handleAddLabelStart}
                            onRemoveLabel={removeLabel}
                            stageRef={stageRef}
                        />
                    ) : (
                        <div className="text-center text-muted-foreground/50 flex flex-col items-center gap-4">
                            <ScanFace className="w-16 h-16 opacity-20" />
                            <p>Upload an image to start labeling</p>
                        </div>
                    )}

                    {/* Canvas Toolbar */}
                    {imageUrl && (
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                            <Button size="icon" variant="secondary" onClick={handleExport} title="Download View">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

            </main>

            {/* Label Input Dialog */}
            <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Label</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="label-name" className="text-right mb-2 block">
                            Label Name
                        </Label>
                        <Input
                            id="label-name"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            placeholder="e.g. Left Eye"
                            onKeyDown={(e) => e.key === 'Enter' && confirmLabel()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={confirmLabel}>Add Label</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RegistrationModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                imageUrl={imageToRegister}
                prompt=""
                labels={labels}
                parentIpId={parentIpId || undefined}
                parentLicenseTermsId={parentLicenseTermsId || undefined}
            />
        </div>
    );
}
