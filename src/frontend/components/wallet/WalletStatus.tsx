"use client";

import { useState, useCallback } from "react";
import { useBalance, useDisconnectWallet } from "@solana/react-hooks";
import { Copy, Check, ExternalLink, LogOut, Wallet } from "lucide-react";

import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";

export interface WalletStatusProps {
  address: string;
  isConnected: boolean;
}

const LAMPORTS_PER_SOL = 1e9;
const EXPLORER_BASE = "https://explorer.solana.com/address";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatSol(lamports: bigint | null | undefined): string {
  if (lamports == null) return "0";
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  if (sol === 0) return "0";
  return sol.toFixed(4);
}

export function WalletStatus({ address, isConnected }: WalletStatusProps) {
  const balance = useBalance(isConnected ? address : undefined);
  const disconnect = useDisconnectWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g., non-HTTPS)
    }
  }, [address]);

  const explorerUrl = `${EXPLORER_BASE}/${address}?cluster=devnet`;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" />
              Wallet
            </CardTitle>
            <Badge
              variant={isConnected ? "success" : "outline"}
              className="flex items-center gap-1.5"
            >
              <span
                className={`size-2 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-muted-foreground/50"
                }`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code
              className="flex-1 truncate rounded-md bg-muted px-3 py-1.5 text-xs font-mono"
              title={address}
            >
              {truncateAddress(address)}
            </code>
            <Tooltip open={copied || undefined}>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  aria-label="Copy wallet address"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{copied ? "Copied!" : "Copy"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-xl font-semibold tabular-nums">
              {balance.fetching ? (
                <span className="text-muted-foreground animate-pulse">
                  Loading...
                </span>
              ) : (
                `${formatSol(balance.lamports)} SOL`
              )}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() =>
                window.open(explorerUrl, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="mr-1.5 size-3.5" />
              Explorer
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => disconnect()}
            >
              <LogOut className="mr-1.5 size-3.5" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
