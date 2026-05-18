"use client";

import { Loader2, Wallet } from "lucide-react";
import { memo } from "react";

import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";

export interface EmbeddedWalletButtonProps {
    onConnect: () => void;
    onDisconnect: () => void;
    isConnected: boolean;
    isConnecting: boolean;
    address: string | null;
    className?: string;
    onMouseEnter?: () => void;
}

function truncateAddress(address: string, chars = 4): string {
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const EmbeddedWalletButton = memo(function EmbeddedWalletButton({
    onConnect,
    onDisconnect,
    isConnected,
    isConnecting,
    address,
    className,
    onMouseEnter,
}: EmbeddedWalletButtonProps) {
    if (isConnecting) {
        return (
            <Button
                disabled
                aria-label="Connecting to embedded wallet"
                data-testid="connecting-embedded-wallet"
                className={cn("gap-2", className)}
            >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Connecting...
            </Button>
        );
    }

    if (isConnected && address) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
                    role="status"
                    aria-label={`Connected to wallet ${truncateAddress(address)}`}
                    data-testid="embedded-wallet-address"
                >
                    <span
                        className="size-2 shrink-0 rounded-full bg-emerald-500"
                        aria-hidden="true"
                    />
                    <span className="font-mono text-muted-foreground">
                        {truncateAddress(address)}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDisconnect}
                    aria-label="Disconnect embedded wallet"
                    data-testid="disconnect-embedded-wallet"
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={onConnect}
            onMouseEnter={onMouseEnter}
            aria-label="Connect embedded wallet"
            data-testid="connect-embedded-wallet"
            className={cn("gap-2", className)}
        >
            <Wallet className="size-4" aria-hidden="true" />
            Connect Embedded Wallet
        </Button>
    );
});
