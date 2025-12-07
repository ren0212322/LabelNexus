"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wand2, Zap, Share2, Layers } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-yellow-100 selection:text-yellow-900">
            <Navbar />

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/20 blur-[100px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-4xl space-y-6"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium text-sm border border-yellow-200 dark:border-yellow-800 mb-4">
                        Build on Story Protocol 🍌
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                        Turn Your Memes into <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">
                            IP Assets
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Create, Remix, and Register your memes on the blockchain.
                        Protect your creativity and earn royalties with the power of Story Protocol.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link href="/create">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95">
                                Start Creating 🚀
                            </Button>
                        </Link>
                        <a href="https://docs.story.foundation" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50">
                                Learn More
                            </Button>
                        </a>
                    </div>
                </motion.div>

                {/* Visual Graphic Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                    className="mt-20 relative w-full max-w-5xl mx-auto rounded-xl shadow-2xl border bg-card/50 backdrop-blur overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
                    <div className="text-muted-foreground/40 font-mono text-sm">
                        [ Interactive Demo Visualization Placeholder ]
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/30 border-t border-b">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <h2 className="text-3xl font-bold">Why MemeStory?</h2>
                        <p className="text-muted-foreground">The ultimate platform for meme creators and collectors, powered by next-gen blockchain tech.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Wand2 className="w-8 h-8 text-purple-500" />}
                            title="AI Powered"
                            description="Generate hilarious memes instantly with Google Gemini 2.0 Flash integration."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Layers className="w-8 h-8 text-blue-500" />}
                            title="Remix Culture"
                            description="Use existing memes as a base. Track provenance and give credit where it's due automatically."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-yellow-500" />}
                            title="Instant IP"
                            description="Register your creations as IP Assets on Story Protocol in one click. Monetize your humor."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t">
                <div className="container flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
                    <p>&copy; 2025 MemeStory. Built for the Story Protocol Hackathon.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-foreground">Twitter</a>
                        <a href="#" className="hover:text-foreground">Discord</a>
                        <a href="#" className="hover:text-foreground">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="p-8 rounded-2xl bg-background border hover:border-yellow-500/50 transition-colors shadow-sm hover:shadow-md"
        >
            <div className="mb-4 p-3 bg-muted rounded-xl inline-block">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </motion.div>
    );
}
