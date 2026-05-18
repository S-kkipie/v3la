"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import type { PropsWithChildren } from "react";
import { solanaClient } from "@/frontend/clients/solana-client";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <TooltipProvider>
      <SolanaProvider client={solanaClient}>{children}</SolanaProvider>
    </TooltipProvider>
  );
}
