"use client";

import { motion } from "motion/react";
import { Card } from "@/frontend/components/ui/card";

interface LoadingOverlayProps {
    message?: string;
    isVisible?: boolean;
}

export function LoadingOverlay({
    message = "Cargando...",
    isVisible = true,
}: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <Card className="flex flex-col items-center px-5 py-6 brutalist-shadow border-2 border-border">
                <div className="relative flex items-center justify-center h-8 w-24 gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="h-3 w-3 rounded-full bg-primary"
                            initial={{ opacity: 0.3, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            transition={{
                                duration: 0.5,
                                repeat: Number.POSITIVE_INFINITY,
                                repeatType: "reverse",
                                delay: i * 0.15,
                            }}
                        />
                    ))}
                </div>
                <div className="mt-4 text-center text-xs font-black uppercase tracking-widest text-foreground">
                    {message}
                </div>
            </Card>
        </div>
    );
}
