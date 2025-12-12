"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group } from 'react-konva';
import useImage from 'use-image';

interface LabelPoint {
    id: string;
    x: number;
    y: number;
    label: string;
}

interface LabelCanvasProps {
    imageUrl: string;
    labels: LabelPoint[];
    onAddLabel: (x: number, y: number) => void;
    onRemoveLabel: (id: string) => void;
    stageRef: any;
}

const URLImage = ({ src, width, height }: { src: string, width: number, height: number }) => {
    const [image] = useImage(src, 'anonymous');

    if (!image) return null;

    // "Contain" logic center
    const scale = Math.min(width / image.width, height / image.height);
    const newWidth = image.width * scale;
    const newHeight = image.height * scale;

    const x = (width - newWidth) / 2;
    const y = (height - newHeight) / 2;

    return <KonvaImage image={image} width={newWidth} height={newHeight} x={x} y={y} />;
};

export function LabelCanvas({ imageUrl, labels, onAddLabel, onRemoveLabel, stageRef }: LabelCanvasProps) {
    const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            setStageSize({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }

        // Handle window resize
        const handleResize = () => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleStageClick = (e: any) => {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        // Only add label if clicking on the stage (not on an existing label which might be handled separately)
        // But here we want simple point adding
        if (pointerPosition) {
            onAddLabel(pointerPosition.x, pointerPosition.y);
        }
    };

    return (
        <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative" ref={containerRef}>
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onClick={handleStageClick}
                onTap={handleStageClick}
                ref={stageRef}
            >
                <Layer>
                    {imageUrl && <URLImage src={imageUrl} width={stageSize.width} height={stageSize.height} />}

                    {labels.map((label) => (
                        <Group key={label.id} x={label.x} y={label.y}>
                            <Circle
                                radius={6}
                                fill="#22d3ee" // Cyan
                                stroke="white"
                                strokeWidth={2}
                                shadowColor="black"
                                shadowBlur={5}
                                shadowOpacity={0.5}
                            />
                            {/* Label Tag */}
                            <Group y={-25} x={10}>
                                <Text
                                    text={label.label}
                                    fontSize={12}
                                    fontFamily="Inter, sans-serif"
                                    fill="white"
                                    padding={4}
                                    listening={false}
                                />
                            </Group>
                            {/* Delete Button Area (simple hitbox around point to remove) */}
                            <Circle
                                radius={10}
                                fill="transparent"
                                onClick={(e) => {
                                    e.cancelBubble = true; // Prevent stage click
                                    onRemoveLabel(label.id);
                                }}
                                onMouseEnter={(e) => {
                                    const container = e.target.getStage()?.container();
                                    if (container) container.style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                    const container = e.target.getStage()?.container();
                                    if (container) container.style.cursor = 'default';
                                }}
                            />
                        </Group>
                    ))}
                </Layer>
            </Stage>
            {labels.length === 0 && imageUrl && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                    Click anywhere to add a label
                </div>
            )}
        </div>
    );
}
