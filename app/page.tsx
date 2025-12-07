"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Type, Download, Wand2, Sticker, Loader2 } from "lucide-react";
import { generateMemeImage } from "./actions/gemini";
import { RegistrationModal } from "@/components/RegistrationModal";

// Wrapper for Konva to avoid SSR
const MemeCanvas = dynamic(() => import("@/components/MemeCanvas").then(mod => mod.MemeCanvas), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-muted-foreground" /></div>
});

export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [texts, setTexts] = useState<Array<any>>([]);
    const [selectedId, selectText] = useState<string | null>(null);

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [imageToRegister, setImageToRegister] = useState("");

    const stageRef = useRef<any>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        try {
            const result = await generateMemeImage(prompt);
            if (result.success && result.imageUrl) {
                setImageUrl(result.imageUrl);
                // Reset texts or keep them? Let's keep them allows remixing idea.
            } else {
                alert(result.error || "Failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const addText = () => {
        const id = "text-" + Date.now();
        setTexts([
            ...texts,
            {
                id,
                content: "DOUBLE CLICK ME",
                x: 50,
                y: 50,
                fontSize: 40,
                color: "white"
            }
        ]);
        selectText(id);
    };

    const updateText = (id: string, newAttrs: any) => {
        const newTexts = texts.map((text) => {
            if (text.id === id) {
                return newAttrs;
            }
            return text;
        });
        setTexts(newTexts);
    };

    const handleExport = () => {
        if (stageRef.current) {
            const uri = stageRef.current.toDataURL();
            const link = document.createElement('a');
            link.download = 'meme-story.png';
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleOpenRegister = () => {
        if (stageRef.current) {
            const uri = stageRef.current.toDataURL();
            setImageToRegister(uri);
            setIsRegisterModalOpen(true);
        } else if (imageUrl) {
            setImageToRegister(imageUrl);
            setIsRegisterModalOpen(true);
        } else {
            alert("Please generate a meme first!");
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 container py-6 gap-6 grid grid-cols-1 lg:grid-cols-[400px_1fr]">

                {/* Left Panel: Controls */}
                <div className="space-y-6">

                    {/* Step 1: Generation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-500" />
                                AI Generation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your meme idea... (e.g., 'A cat trading crypto on the moon')"
                                className="resize-none min-h-[100px]"
                            />
                            <Button
                                onClick={handleGenerate}
                                disabled={isLoading || !prompt}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            >
                                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : "Generate Meme 🚀"}
                            </Button>
                        </CardContent>
                    </Card>



                    {/* Step 3: Registration */}
                    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Story Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Register your meme as an IP Asset to enable remixing and royalties.
                            </p>
                            <Button className="w-full" variant="secondary" onClick={handleOpenRegister}>
                                Mint & Register IP
                            </Button>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Panel: Canvas */}
                <div className="bg-muted/30 border rounded-xl flex items-center justify-center min-h-[500px] relative overflow-hidden h-[600px]">
                    {imageUrl || texts.length > 0 ? (
                        <MemeCanvas
                            imageUrl={imageUrl}
                            texts={texts}
                            onUpdateText={updateText}
                            onSelectText={selectText}
                            selectedId={selectedId}
                            stageRef={stageRef}
                        />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <p>Canvas Area</p>
                            <p className="text-sm">Generated image will appear here</p>
                        </div>
                    )}


                    {/* Canvas Toolbar */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <Button size="icon" variant="secondary" onClick={handleExport} title="Download">
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </main>

            <RegistrationModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                imageUrl={imageToRegister}
                prompt={prompt}
            />
        </div>
    );
}
