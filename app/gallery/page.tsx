"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Search, Zap, ExternalLink, Layers } from "lucide-react";
import { fetchCollectionItems, fetchIpAsset, GalleryItem } from "@/app/actions/story";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";

// Default to a known collection if none searched (optional, or just show empty state)
// For now, let's leave it empty or user has to search.
// Maybe we can create a "Featured" section later.

export default function GalleryPage() {
    const [ipId, setIpId] = useState("");
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const { address: connectedAddress } = useWallet();
    const [hasAutoSearched, setHasAutoSearched] = useState(false);

    // Auto-search latest created collection from localStorage
    // MODIFIED: If we store IP IDs now, we could load that. 
    // But for now, let's just default to empty/manual search as requested.

    const handleSearch = async (searchId?: string) => {
        const target = searchId || ipId;
        if (!target) return;

        setIsLoading(true);
        setError("");
        setItems([]);

        try {
            // Updated to fetch Single IP
            const result = await fetchIpAsset(target);
            if (result.error) {
                setError(result.error);
            } else {
                setItems(result.items);
            }
        } catch (e) {
            setError("Failed to fetch IP Asset.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemix = (item: GalleryItem) => {
        // Navigate to Explore page with IP ID autofilled
        // Fallback to the text input (ipId) if the item id is missing/undefined for some reason
        const targetId = item.id || ipId;

        const params = new URLSearchParams();
        params.set("ipId", targetId);

        router.push(`/explore?${params.toString()}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="container mx-auto py-8 max-w-5xl">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">LabelNexus Gallery</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        View IP Assets on Story Protocol. Enter an IP Address (0x...) to verify details and remix.
                    </p>

                    <div className="flex w-full max-w-sm items-center space-x-2 mx-auto">
                        <Input
                            type="text"
                            placeholder="Enter IP Asset ID (0x...)"
                            value={ipId}
                            onChange={(e) => setIpId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={() => handleSearch()} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                {/* Grid */}
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                                <div className="aspect-square relative overflow-hidden bg-muted">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized // For IPFS images
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4 flex-1">
                                    <h3 className="font-semibold truncate" title={item.title}>{item.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        Token #{item.tokenId}
                                    </p>
                                </CardContent>

                                <CardFooter className="p-4 pt-0">
                                    <Button className="w-full gap-2" variant="secondary" onClick={() => handleRemix(item)}>
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        Remix This
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    !isLoading && ipId && !error && (
                        <div className="text-center py-20 text-muted-foreground">
                            No items found or invalid collection.
                        </div>
                    )
                )}

                {/* Empty State / Defaults */}
                {!ipId && (
                    <div className="space-y-12">
                        {/* 1. Quick Action: View My Wallet */}
                        <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/20">
                            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">Explore the Gallery</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Search for any IP Asset ID to view details and remix it.
                            </p>
                            {/* Hint for auto-fill */}
                            <p className="text-xs text-muted-foreground">
                                Hint: Connected? Search your address to see your held IPs.
                            </p>
                        </div>

                        {/* 2. No saved collections for now as we switched to IP ID search */}
                    </div>
                )}
            </main>
        </div>
    );
}

function SavedCollections({ onSelect }: { onSelect: (addr: string) => void }) {
    const [saved, setSaved] = useState<Array<{ name: string, address: string }>>([]);

    // Load from local storage on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem("memeStory_collections");
            if (data) {
                try {
                    setSaved(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse collections", e);
                }
            }
        }
    });

    if (saved.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="w-6 h-6 text-yellow-500" />
                Your Created Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saved.map((col, idx) => (
                    <Card key={idx} className="hover:border-yellow-400 cursor-pointer transition-all" onClick={() => onSelect(col.address)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="overflow-hidden">
                                <h3 className="font-semibold truncate">{col.name}</h3>
                                <p className="text-xs text-muted-foreground font-mono truncate">{col.address}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
