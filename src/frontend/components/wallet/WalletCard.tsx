"use client";

import { Check, Copy, ExternalLink, Wallet } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { cn } from "@/frontend/lib/utils";

export interface WalletCardProps {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  onDisconnect: () => void;
  className?: string;
}

const EXPLORER_BASE = "https://explorer.solana.com/address";
const CLUSTER = "devnet";

function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function WalletCard({
  address,
  balance,
  isConnected,
  onDisconnect,
  className,
}: WalletCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = address
    ? `${EXPLORER_BASE}/${address}?cluster=${CLUSTER}`
    : null;

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4 text-muted-foreground" />
            Embedded Wallet
          </CardTitle>
          <Badge variant={isConnected ? "success" : "default"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {address ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-sm text-muted-foreground"
                title={address}
              >
                {truncateAddress(address)}
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleCopy}
                      aria-label={copied ? "Address copied" : "Copy address"}
                    >
                      {copied ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  }
                />
                <TooltipContent>
                  {copied ? "Copied!" : "Copy address"}
                </TooltipContent>
              </Tooltip>
            </div>

            {balance && (
              <div className="text-2xl font-semibold tracking-tight">
                {balance}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  SOL
                </span>
              </div>
            )}

            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-3 hover:text-foreground"
              >
                View on Explorer
                <ExternalLink className="size-3" />
              </a>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No wallet connected. Connect your embedded wallet to get started.
          </p>
        )}
      </CardContent>

      {isConnected && (
        <CardFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDisconnect}
            className="w-full"
          >
            Disconnect
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
