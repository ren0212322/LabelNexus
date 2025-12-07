"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // I might need to add badge if I missed it, or use custom
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Droplets, Gift } from "lucide-react";

export function Navbar() {
    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    🍌 <span>MemeStory</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex gap-6 text-sm font-medium">
                    <Link href="/create" className="hover:text-primary transition-colors">Studio</Link>
                    <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors">Gallery</Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" onClick={() => alert("Claiming 100 MEME tokens... (Coming Soon)")}>
                        <Gift className="w-4 h-4" />
                        Daily Claim
                    </Button>

                    <a href="https://cloud.google.com/application/web3/faucet/story/aeneid" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            Faucet
                        </Button>
                    </a>

                    <ConnectButton showBalance={{ smallScreen: false, largeScreen: true }} />
                </div>

            </div >
        </nav >
    );
}
