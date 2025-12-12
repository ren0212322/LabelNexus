"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScanFace, Database, Stamp } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-purple-500/30 selection:text-purple-200">
            <Navbar />

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-4xl space-y-8"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 font-medium text-sm border border-purple-500/20 mb-4">
                        Powered by Story Protocol
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white">
                        Label Data. Own the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                            Knowledge Layer
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        <strong>LabelHuman</strong> transforms your data labeling work into liquid intellectual property.
                        Contribute to open datasets, register your labels on-chain, and <strong>earn royalties</strong> when AI models use your data.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link href="/create">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95">
                                Start Labeling 🏷️
                            </Button>
                        </Link>
                        <a href="https://docs.story.foundation" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50">
                                View Documentation
                            </Button>
                        </a>
                    </div>
                </motion.div>

                {/* Visual Graphic Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                    className="mt-24 relative w-full max-w-5xl mx-auto rounded-xl shadow-2xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5" />
                    <div className="flex flex-col items-center gap-4 text-muted-foreground/40 font-mono text-sm">
                        <ScanFace className="w-12 h-12 opacity-50" />
                        <span>[ Data Annotation Interface Preview ]</span>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/20 border-t border-white/5">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <h2 className="text-3xl font-bold text-white">The Future of AI Data</h2>
                        <p className="text-muted-foreground">High-quality human labels are the scarcest resource in AI. We help you own them.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ScanFace className="w-8 h-8 text-purple-400" />}
                            title="Precision Labeling"
                            description="Use our intuitive point-and-click interface to label features on humans, objects, and scenes with high accuracy."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Database className="w-8 h-8 text-cyan-400" />}
                            title="On-Chain IP Datasets"
                            description="Every labeled image is registered as an IP Asset on Story Protocol. You own the data you create."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<Stamp className="w-8 h-8 text-pink-400" />}
                            title="Fair Attribution"
                            description="When developers train models on the LabelHuman registry, you get attributed and compensated automatically."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10">
                <div className="container flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
                    <p>&copy; 2025 LabelHuman. Built for the Story Protocol Hackathon.</p>
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
            className="p-8 rounded-2xl bg-card border border-white/5 hover:border-purple-500/30 transition-colors shadow-sm hover:shadow-lg hover:shadow-purple-500/5 group"
        >
            <div className="mb-6 p-4 bg-muted rounded-xl inline-block group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </motion.div>
    );
}
