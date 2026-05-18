"use client";

import { SolanaProvider } from "@solana/react-hooks";
import type { PropsWithChildren } from "react";
import { solanaClient } from "@/frontend/clients/solana-client";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";

export default function Providers({ children }: PropsWithChildren) {
    return (
        <TooltipProvider>
            <SolanaProvider client={solanaClient}>{children}</SolanaProvider>
        </TooltipProvider>
    );
}
